module;

#include <mutex>
#include <string>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.sql;
import cpx.serde;
import cpx.protobuf;
import cpx.toruniina_toml;
import cpx.yy_json;

void ile::App::api_states() {
    router.route_ws("/ws/state", [this](Context &c) -> asio::awaitable<void> {
        auto params = c.url.params();

        std::string office, counter, date;
        for (auto param : params) {
            if (param.key == "office")
                office = std::string(param.value);
            if (param.key == "counter")
                counter = std::string(param.value);
            if (param.key == "date")
                date = std::string(param.value);
        }

        const Room room = {office, counter, date};
        {
            std::unique_lock<std::mutex> lock(this->mtx);

            auto it = this->offices.find(office);
            if (it == this->offices.end()) {
                co_await c.ws_stream->async_close("office not found");
                co_return;
            }

            this->rooms[room].push_back(c.ws_stream);
        }
        asio::co_spawn(io, broadcast(std::move(room)), asio::detached);

        while (is_running) {
            beast::flat_buffer buffer;

            try {
                co_await c.ws_stream->async_read(buffer);
            } catch (boost::system::system_error &e) {
                std::unique_lock<std::mutex> lock(this->mtx);

                if (auto it = rooms.find(room); it != rooms.end()) {
                    std::ignore = std::erase_if(it->second, [&](const std::shared_ptr<ws_stream> &s) {
                        return c.ws_stream.get() == s.get();
                    });
                }

                lock.unlock();

                throw;
            }
        }
    });
}
