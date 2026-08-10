module;

#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.sqlite;
import cpx.fmt;
import cpx.yy_json;

asio::awaitable<void> ile::App::broadcast(const Room &room) {
    auto it = rooms.find(room);
    if (it == rooms.end()) {
        co_return;
    }

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
                        items.carat,
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
                    item.carat,
                    item.price_type,
                    item.price_per_gram,
                    item.total_price
                ) = row.get();

                ticket.items.push_back(std::move(item));
            }
        }
    }

    auto payload = cpx::yy_json::dump(res);

    for (auto stream : it->second) {
        co_await stream->async_write(asio::buffer(payload));
    }
}
