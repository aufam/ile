module;

#include "../boost.h"
#include <xxhash.h>

module ile;
import fmt;
import cpx;
import cpx.yy_json;

void ile::App::api_images() {
    router.http_handlers["POST /api/images"] = [](const http_request &req, http_response &res) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url) {
            fmt::println(stderr, "URL parse error");
            res.result(http::status::bad_request);
            co_return;
        }

        std::string key, office, counter, date;

        auto params = url->params();
        for (auto param : params) {
            if (param.key == "key")
                key = std::string(param.value);
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

        std::string_view image_type;
        if (key == "photo1")
            image_type = "ori";
        else if (key == "photo2")
            image_type = "weight";
        else if (key == "photo3")
            image_type = "xrf";
        else {
            fmt::println(stderr, "missing field");
            res.result(http::status::bad_request);
            co_return;
        }

        const auto content_type = req[http::field::content_type];
        const auto image_bytes  = req.body();
        if (!content_type.starts_with("image/jpeg") && !content_type.starts_with("image/jpg")) {
            // only accept jpg for now
            res.result(http::status::bad_request);
            co_return;
        }

        XXH3_state_t *state = XXH3_createState();
        XXH3_128bits_reset(state);

        XXH3_128bits_update(state, image_bytes.data(), image_bytes.size());

        auto hash = XXH3_64bits_digest(state);
        XXH3_freeState(state);

        const auto filename = fmt::format("{}_{}_{}_{}_{:016x}.jpg", date, office, counter, image_type, hash);

        std::ofstream file("static/images/" + filename, std::ios::binary);
        if (!file) {
            res.result(http::status::internal_server_error);
            co_return;
        }
        file.write(image_bytes.data(), static_cast<std::streamsize>(image_bytes.size()));

        const std::string uri    = "/images/" + filename;
        const std::tuple  fields = {
            cpx::field_ref(uri) = "uri",
        };

        res.body() = cpx::yy_json::dump(fields);
        res.set(http::field::content_type, "application/json");
        res.result(http::status::ok);
    };
}
