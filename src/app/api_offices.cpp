module;

#include <tuple>
#include <mutex>
#include <string>
#include <algorithm>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.serde;
import cpx.protobuf;
import cpx.toruniina_toml;
import cpx.yy_json;


void ile::App::api_offices() {
    router.http_handlers["GET /api/offices"] = [this](const http_request &, http_response &res) -> asio::awaitable<void> {
        std::unique_lock<std::mutex> lock(this->mtx);
        res.body() = cpx::yy_json::dump(this->offices);
        res.set(http::field::content_type, "application/json");
        co_return;
    };

    router.http_handlers["PATCH /api/prices"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        std::string office, price_type;
        size_t      new_price;
        std::tuple  fields = {
            cpx::field_ref(office)     = "office",
            cpx::field_ref(price_type) = "priceType",
            cpx::field_ref(new_price)  = "newPrice",
        };

        try {
            cpx::yy_json::parse(req.body(), fields);
        } catch (cpx::serde::error &e) {
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto it = this->offices.find(office);
        if (it == this->offices.end()) {
            res.result(http::status::not_found);
            co_return;
        }

        auto &pricelist = it->second.pricelist;

        auto p = std::find_if(pricelist.begin(), pricelist.end(), [&price_type](Price &p) { return p.type == price_type; });
        if (p == pricelist.end()) {
            res.result(http::status::not_found);
            co_return;
        }

        p->price = new_price;
        std::ofstream ofs(this->args.offices);
        ofs << cpx::toruniina_toml::io << this->offices;
        res.result(http::status::no_content);
        co_return;
    };
}
