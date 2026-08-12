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
        const auto &socket      = stream->next_layer();
        const auto  remote      = socket.remote_endpoint();
        const auto  remote_name = fmt::format("{}:{}", remote.address().to_string(), remote.port());

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

        Room room = {office, counter, date};
        this->rooms[room].push_back({stream, remote_name});

        lock.unlock();
        asio::co_spawn(io, broadcast(std::move(room)), asio::detached);
    };

    router.http_handlers["DELETE /ws/state"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            res.result(http::status::bad_request);
            co_return;
        }

        auto params = url->params();

        std::string remote_name;
        for (auto param : params) {
            if (param.key == "remoteName")
                remote_name = std::string(param.value);
        }
        if (remote_name.empty()) {
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);
        for (auto &[_, streams] : this->rooms) {
            std::erase_if(streams, [&](const std::pair<std::shared_ptr<ws_stream>, std::string> &s) {
                return remote_name == s.second;
            });
        }
    };
}
