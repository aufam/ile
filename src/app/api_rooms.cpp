module;

#include "../boost.h"
#include <xxhash.h>

module ile;
import fmt;
import cpx;
import cpx.yy_json;

void ile::App::api_rooms() {
    router.route("GET /api/rooms", [this](Context &c) -> asio::awaitable<void> {
        auto &res = c.response_string();

        std::unique_lock<std::mutex> lock(this->mtx);

        std::vector<Room>   rooms;
        std::vector<size_t> lengths;
        for (auto &[room, streams] : this->rooms) {
            rooms.push_back(room);
            lengths.push_back(streams.size());
        }

        std::tuple fields = {
            cpx::field_ref(rooms)   = "rooms",
            cpx::field_ref(lengths) = "lengths",
        };

        res.body() = cpx::yy_json::dump(fields);
        res.set(http::field::content_type, "application/json");
        res.result(http::status::ok);
        co_return;
    });
}
