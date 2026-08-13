module;

#include <mutex>
#include <string>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.sql;
import cpx.sqlite;
import cpx.serde;
import cpx.protobuf;
import cpx.toruniina_toml;
import cpx.yy_json;

void ile::App::api_items() {
    namespace sql = cpx::sql;
    using ile::database::items;
    using ile::database::tickets;

    router.http_handlers["GET /api/items"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            res.result(http::status::bad_request);
            co_return;
        }

        Room room;

        auto params = url->params();
        for (auto param : params) {
            if (param.key == "office")
                room.office = std::string(param.value);
            if (param.key == "counter")
                room.counter = std::string(param.value);
            if (param.key == "date")
                room.date = std::string(param.value);
        }

        if (room.office.empty() || room.counter.empty() || room.date.empty()) {
            res.result(http::status::bad_request);
            co_return;
        }

        std::vector<ile::Ticket> t;
        {
            std::unique_lock<std::mutex> lock(this->mtx);

            auto row =
                db( //
                    sql::select(
                        tickets.id,
                        tickets.office,
                        tickets.counter,
                        tickets.staff_name,
                        tickets.customer_name,
                        tickets.customer_queue_number,
                        tickets.date,
                        tickets.status,
                        tickets.signature
                    )
                        .from(tickets)
                        .where(tickets.office == room.office && tickets.counter == room.counter && tickets.date == room.date)
                        .order_by(tickets.id.desc())
                );

            for (; !row.is_done(); row.next()) {
                ile::Ticket ticket;
                std::tie(
                    ticket.id,
                    ticket.office,
                    ticket.counter,
                    ticket.staff_name,
                    ticket.customer_name,
                    ticket.customer_queue_number,
                    ticket.date,
                    ticket.status,
                    ticket.signature
                ) = row.get();

                t.push_back(std::move(ticket));
            }

            for (auto &ticket : t) {
                auto row =
                    db( //
                        sql::select(
                            items.id,
                            items.ticket_id,
                            items.title,
                            items.photo,
                            items.weighing_photo,
                            items.xrf_photo,
                            items.weight,
                            items.purity,
                            items.price_type,
                            items.price_per_gram,
                            items.total_price
                        )
                            .from(items)
                            .where(items.ticket_id == ticket.id)
                            .order_by(items.id.desc())
                    );
                for (; !row.is_done(); row.next()) {
                    ile::Item item;
                    std::tie(
                        item.id,
                        item.ticket_id,
                        item.title,
                        item.photo,
                        item.weighing_photo,
                        item.xrf_photo,
                        item.weight,
                        item.purity,
                        item.price_type,
                        item.price_per_gram,
                        item.total_price
                    ) = row.get();

                    ticket.items.push_back(std::move(item));
                }
            }
        }

        res.body() = cpx::yy_json::dump(t);
        res.set(http::field::content_type, "application/json");
        res.result(http::status::ok);
        co_return;
    };

    router.http_handlers["POST /api/items"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            fmt::println(stderr, "URL parse error");
            res.result(http::status::bad_request);
            co_return;
        }

        std::string office, counter, date;
        long long   ticket_id = 0;

        auto params = url->params();
        for (auto param : params) {
            if (param.key == "office")
                office = std::string(param.value);
            if (param.key == "counter")
                counter = std::string(param.value);
            if (param.key == "date")
                date = std::string(param.value);
            if (param.key == "ticketId")
                ticket_id = std::stoll(param.value);
        }

        if (office.empty() || counter.empty() || date.empty() || ticket_id == 0) {
            fmt::println(stderr, "missing field");
            res.result(http::status::bad_request);
            co_return;
        }

        ile::Item item;
        try {
            cpx::yy_json::parse(req.body(), item);
        } catch (cpx::serde::error &e) {
            fmt::println(stderr, "failed to parse json: {:?}: {}", req.body(), e.what());
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto ticket_row = db(sql::select(tickets.id).from(tickets).where(tickets.id == ticket_id));
        if (ticket_row.is_done()) {
            res.result(http::status::not_found);
            co_return;
        }

        auto row = db(sql::select(items.id).from(items).where(items.id == item.id));
        if (row.is_done()) {
            db(ile::database::insert_into_items(ticket_id, item));
        } else {
            db(ile::database::update_item(item));
        }

        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({office, counter, date}), asio::detached);
    };

    router.http_handlers["DELETE /api/items"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
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
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto row = db(sql::select(items.id).from(items).where(items.id == id));
        if (row.is_done()) {
            res.result(http::status::bad_request);
            co_return;
        }

        db(sql::delete_from(items).where(items.id == id));

        res.result(http::status::ok);

        lock.unlock();
        asio::co_spawn(io, broadcast({office, counter, date}), asio::detached);
    };
}
