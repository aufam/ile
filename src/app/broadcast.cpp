module;

#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.sqlite;
import cpx.fmt;
import cpx.yy_json;


asio::awaitable<void> ile::App::broadcast(const Room &room) {
    namespace sql = cpx::sql;
    using ile::database::items;
    using ile::database::tickets;

    std::vector<ile::Ticket> res;
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

            res.push_back(std::move(ticket));
        }

        for (auto &ticket : res) {
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

    auto payload = std::make_shared<std::string>(cpx::yy_json::dump(res));

    std::vector<std::shared_ptr<ws_stream>> streams;
    {
        std::unique_lock<std::mutex> lock(this->mtx);
        if (auto it = rooms.find(room); it == rooms.end()) {
            co_return;
        } else {
            streams = it->second;
        }
    }

    for (auto stream : streams) {
        // TODO: need to serialize stream write?
        asio::co_spawn(
            io,
            [stream, payload]() -> asio::awaitable<void> {
                beast::error_code ec;
                co_await stream->async_write(asio::buffer(*payload), asio::redirect_error(asio::use_awaitable, ec));
            },
            asio::detached
        );
    }
}
