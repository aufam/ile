module;

#include <tuple>
#include <string>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.serde;
import cpx.yy_json;


void ile::App::api_login() {
    router.route("POST /api/login", [](Context &c) -> asio::awaitable<void> {
        auto &req = c.parser_string().get();
        auto &res = c.response_string();

        std::string branch, counter, name, date;
        std::tuple  fields = {
            cpx::field_ref(branch)  = "branch",
            cpx::field_ref(counter) = "counter",
            cpx::field_ref(name)    = "name",
            cpx::field_ref(date)    = "date",
        };
        try {
            cpx::yy_json::parse(req.body(), fields);
        } catch (cpx::serde::error &e) {
            std::string err = e.what();
            res.result(http::status::bad_request);
            res.set(http::field::content_type, "application/json");
            res.body() = cpx::yy_json::dump(std::tuple{cpx::field_ref(err) = "error"});
            co_return;
        }

        urls::url url;
        url.set_params({
            {"branch",  branch },
            {"counter", counter},
            {"name",    name   },
            {"date",    date   },
        });

        res.set(http::field::set_cookie, fmt::format("session={}; HttpOnly; Secure; SameSite=Lax; Path=/", url.encoded_query()));
        co_return;
    });

    router.route("GET /api/appraiser", [](Context &c) -> asio::awaitable<void> {
        auto &req = c.parser_string().get();
        auto &res = c.response_string();

        auto cookie = req[http::field::cookie];

        auto pos = cookie.find("session=");
        if (pos == std::string_view::npos) {
            std::string err = "cookie not set";
            res.result(http::status::bad_request);
            res.set(http::field::content_type, "application/json");
            res.body() = cpx::yy_json::dump(std::tuple{cpx::field_ref(err) = "error"});
            co_return;
        }

        pos += std::string_view("session=").size();
        auto end     = cookie.find(';', pos);
        auto session = cookie.substr(pos, end == std::string_view::npos ? std::string_view::npos : end - pos);

        auto pr = boost::urls::parse_query(session);
        if (!pr) {
            std::string err = "invalid url";
            res.result(http::status::bad_request);
            res.set(http::field::content_type, "application/json");
            res.body() = cpx::yy_json::dump(std::tuple{cpx::field_ref(err) = "error"});
            co_return;
        }
        auto &params = *pr;

        std::string branch, counter, name, date;
        for (auto [k, v, _] : params) {
            if (k == "branch")
                branch = v;
            else if (k == "counter")
                counter = v;
            else if (k == "name")
                name = v;
            else if (k == "date")
                date = v;
        }

        res.body() = cpx::yy_json::dump(
            std::tuple{
                cpx::field_ref(branch)  = "branch",
                cpx::field_ref(counter) = "counter",
                cpx::field_ref(name)    = "name",
                cpx::field_ref(date)    = "date",
            }
        );
        co_return;
    });
}
