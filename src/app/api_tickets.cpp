module;

#include <tuple>
#include <mutex>
#include <string>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.sqlite;
import cpx.fmt;
import cpx.sql;
import cpx.serde;
import cpx.protobuf;
import cpx.toruniina_toml;
import cpx.yy_json;

void ile::App::api_tickets() {
    namespace sql = cpx::sql;
    using ile::database::tickets;

    router.http_handlers["POST /api/tickets"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            fmt::println(stderr, "URL parse failed");
            res.result(http::status::bad_request);
            co_return;
        }

        auto params = url->params();

        std::string office, counter, date;
        for (auto param : params) {
            if (param.key == "office")
                office = std::string(param.value);
            if (param.key == "counter")
                counter = std::string(param.value);
            if (param.key == "date")
                date = std::string(param.value);
        }
        if (office.empty() || counter.empty() || date.empty()) {
            fmt::println(stderr, "missing field");
            res.result(http::status::bad_request);
            co_return;
        }

        std::string staff_name, customer_name, customer_queue_number, status;
        std::tuple  fields = {
            cpx::field_ref(staff_name)            = "staff_name",
            cpx::field_ref(customer_name)         = "customer_name",
            cpx::field_ref(customer_queue_number) = "customer_queue_number",
            cpx::field_ref(status)                = "status",
        };

        try {
            cpx::yy_json::parse(req.body(), fields);
        } catch (cpx::serde::error &e) {
            fmt::println(stderr, "failed to parse json: {:?}: {}", req.body(), e.what());
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto ticket_row =
            db( //
                sql::select(tickets.customer_queue_number)
                    .from(tickets)
                    .where(
                        tickets.office == office && tickets.counter == counter && tickets.date == date &&
                        tickets.customer_queue_number == customer_queue_number
                    )
            );
        if (!ticket_row.is_done()) {
            res.result(http::status::precondition_failed);
            co_return;
        }

        db( //
            sql::insert_into<tickets>(
                tickets.office,
                tickets.counter,
                tickets.staff_name,
                tickets.customer_name,
                tickets.customer_queue_number,
                tickets.date,
                tickets.status
            )
                .values({office, counter, staff_name, customer_name, customer_queue_number, date, status})
        );

        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({office, counter, date}), asio::detached);
    };

    router.http_handlers["DELETE /api/tickets"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            fmt::println(stderr, "URL parse failed");
            res.result(http::status::bad_request);
            co_return;
        }

        long long   id = 0;
        std::string office, counter, date;

        auto params = url->params();
        for (auto param : params) {
            if (param.key == "id")
                id = std::stoll(param.value);
            if (param.key == "office")
                office = std::string(param.value);
            if (param.key == "counter")
                counter = std::string(param.value);
            if (param.key == "date")
                date = std::string(param.value);
        }
        if (id == 0 || office.empty() || counter.empty() || date.empty()) {
            fmt::println(stderr, "missing params");
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto row = db(sql::select(tickets.id).from(tickets).where(tickets.id == id));
        if (row.is_done()) {
            res.result(http::status::not_found);
            co_return;
        }

        db(sql::delete_from(tickets).where(tickets.id == id));

        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({office, counter, date}), asio::detached);
    };
}
