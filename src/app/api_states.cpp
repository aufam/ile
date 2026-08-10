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
    router.ws_handlers["/ws/state"] =
        [this](const http_request &req, std::shared_ptr<ws_stream> stream) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url)
            co_return;

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

        std::unique_lock<std::mutex> lock(this->mtx);

        auto it = this->offices.find(office);
        if (it == this->offices.end()) {
            co_return;
        }

        auto &counters = it->second.counters;

        auto p = std::find_if(counters.begin(), counters.end(), [&counter](std::string &c) { return c == counter; });
        if (p == counters.end()) {
            co_return;
        }

        Room room = {office, counter, date};
        this->rooms[room].push_back(stream);

        lock.unlock();
        asio::co_spawn(io, broadcast(std::move(room)), asio::detached);
    };
}
