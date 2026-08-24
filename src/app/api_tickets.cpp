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

    router.route("POST /api/tickets", [this](Context &c) -> asio::awaitable<void> {
        fmt::println("enter post tickets");
        auto &req = c.parser_string().get();
        auto &res = c.response_string();

        auto params = c.url.params();
        fmt::println("enter post tickets 2");

        ile::Ticket ticket;
        for (auto param : params) {
            if (param.key == "office")
                ticket.office = std::string(param.value);
            if (param.key == "counter")
                ticket.counter = std::string(param.value);
            if (param.key == "date")
                ticket.date = std::string(param.value);
        }
        if (ticket.office.empty() || ticket.counter.empty() || ticket.date.empty()) {
            fmt::println(stderr, "missing field");
            res.result(http::status::bad_request);
            co_return;
        }
        fmt::println("enter post tickets 3");

        std::tuple fields = {
            cpx::field_ref(ticket.staff_name)            = "staff_name",
            cpx::field_ref(ticket.customer_name)         = "customer_name",
            cpx::field_ref(ticket.customer_queue_number) = "customer_queue_number",
            cpx::field_ref(ticket.status)                = "status",
        };

        fmt::println("enter post tickets 4");
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
                        tickets.office == ticket.office &&   //
                        tickets.counter == ticket.counter && //
                        tickets.date == ticket.date &&       //
                        tickets.customer_queue_number == ticket.customer_queue_number
                    )
            );
        if (!ticket_row.is_done()) {
            res.result(http::status::conflict);
            res.reason("Already exists");
            co_return;
        }

        db(ile::database::insert_into_tickets(ticket));
        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({ticket.office, ticket.counter, ticket.date}), asio::detached);
    });

    router.route("PATCH /api/tickets", [this](Context &c) -> asio::awaitable<void> {
        auto &req = c.parser_string().get();
        auto &res = c.response_string();

        ile::Ticket ticket;
        try {
            cpx::yy_json::parse(req.body(), ticket);
        } catch (cpx::serde::error &e) {
            fmt::println(stderr, "failed to parse json: {:?}: {}", req.body(), e.what());
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto ticket_row = db(sql::select(tickets.id).from(tickets).where(tickets.id == ticket.id));
        if (ticket_row.is_done()) {
            res.result(http::status::not_found);
            co_return;
        }

        db(ile::database::update_ticket(ticket));
        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({ticket.office, ticket.counter, ticket.date}), asio::detached);
    });

    router.route("DELETE /api/tickets", [this](Context &c) -> asio::awaitable<void> {
        auto &res = c.response_string();

        long long   id = 0;
        std::string office, counter, date;

        auto params = c.url.params();
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
    });
}
