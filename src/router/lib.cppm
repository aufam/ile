module;

#include <variant>
#include <functional>
#include <unordered_map>
#include <map>
#include "../boost.h"

export module ile:router;

export namespace ile {
    struct Router;
    struct Context;
} // namespace ile

struct ile::Router {
    using Handler            = std::function<awaitable<void>(Context &)>;
    using _map_handlers_t    = std::unordered_map<std::string, Handler>;
    using _map_ws_handlers_t = std::unordered_map<std::string, Handler>;
    using _map_middlewares_t = std::multimap<std::string, Handler>;

    struct _longest_first_t {
        bool operator()(const std::string &a, const std::string &b) const {
            return a.size() == b.size() ? a < b : a.size() > b.size();
        }
    };
    using _map_file_handlers_t = std::map<std::string, std::string, _longest_first_t>;

    _map_handlers_t      handlers;
    _map_ws_handlers_t   ws_handlers;
    _map_file_handlers_t file_handlers;
    _map_middlewares_t   middlewares;

    mutable std::mutex                               _mtx;
    mutable std::vector<std::shared_ptr<tcp_stream>> _tcp_streams;
    mutable std::vector<std::shared_ptr<ws_stream>>  _ws_streams;

    void route(std::string path, Handler fn) {
        std::unique_lock<std::mutex> lock(_mtx);
        handlers[path] = std::move(fn);
    }

    void route_ws(std::string path, std::function<awaitable<void>(Context &)> fn) {
        std::unique_lock<std::mutex> lock(_mtx);
        ws_handlers[path] = std::move(fn);
    }

    void use(std::string path, std::function<awaitable<void>(Context &)> fn) {
        std::unique_lock<std::mutex> lock(_mtx);
        middlewares.insert({std::move(path), std::move(fn)});
    }

    void mount(std::string path, std::string dir) {
        std::unique_lock<std::mutex> lock(_mtx);
        file_handlers[path] = dir;
    }

    awaitable<bool> handle(std::shared_ptr<tcp_stream>) const;
    awaitable<void> close_all_streams() const;

    void            match(Context &) const;
    awaitable<bool> handle_ws(Context &) const;
};

struct ile::Context {
    friend Router;

    std::shared_ptr<tcp_stream> stream;
    std::shared_ptr<ws_stream>  ws_stream;
    urls::url                   url;
    beast::flat_buffer          buffer;

    /// set local variable for this context
    template <typename T>
    void set(std::string_view key, const T &val) {
        vars[std::string(key)] = val;
    }

    /// get local variable for this context
    template <typename T>
    const T &get(std::string_view key) const {
        return std::any_cast<const T &>(vars.at(std::string(key)));
    }

    /// get local variable for this context
    template <typename T>
    T &get(std::string_view key) {
        return std::any_cast<T &>(vars.at(std::string(key)));
    }

    /// get parsed request header
    const http::request_header<http::fields> &req() const {
        if (parser.index() == 0) {
            return std::get<0>(parser).get().base();
        } else if (parser.index() == 1) {
            return std::get<1>(parser)->get().base();
        } else if (parser.index() == 2) {
            return std::get<2>(parser)->get().base();
        } else {
            return std::get<3>(parser)->get().base();
        }
    }

    /// get current response header
    http::response_header<http::fields> &res() {
        return std::visit([](auto &response) -> http::response_header<http::fields> & { return response.base(); }, response);
    }

    /// invoke next handler
    awaitable<void> next() {
        if (idx < handlers.size())
            co_await handlers[idx++](*this);
    }

    /// get response as empty-body response
    http::response<http::empty_body> &response_empty() {
        return std::get<http::response<http::empty_body>>(response);
    }

    /// get the response as a string-body response.
    /// if the current response has an empty body, it is converted to a string-body response.
    http::response<http::string_body> &response_string() {
        if (auto *p = std::get_if<http::response<http::string_body>>(&response))
            return *p;
        response = http::response<http::string_body>(std::move(response_empty()));
        return std::get<http::response<http::string_body>>(response);
    }

    /// get the response as a file-body response.
    /// if the current response has an empty body, it is converted to a file-body response.
    http::response<http::file_body> &response_file() {
        if (auto *p = std::get_if<http::response<http::file_body>>(&response))
            return *p;
        response = http::response<http::file_body>(std::move(response_empty()));
        return std::get<http::response<http::file_body>>(response);
    }

    /// get the response as a buffer-body response.
    /// if the current response has an empty body, it is converted to a buffer-body response.
    http::response<http::buffer_body> &response_buffer() {
        if (auto *p = std::get_if<http::response<http::buffer_body>>(&response))
            return *p;
        response = http::response<http::buffer_body>(std::move(response_empty()));
        return std::get<http::response<http::buffer_body>>(response);
    }

    http::request_parser<http::empty_body> &parser_empty() {
        return std::get<empty_parser_t>(parser);
    }

    http::request_parser<http::string_body> &parser_string() {
        if (auto *p = std::get_if<string_parser_t>(&parser))
            return *p->get();
        parser = std::make_unique<http::request_parser<http::string_body>>(std::move(parser_empty()));
        return *std::get<string_parser_t>(parser);
    }

    http::request_parser<http::file_body> &parser_file() {
        if (auto *p = std::get_if<file_parser_t>(&parser))
            return *p->get();
        parser = std::make_unique<http::request_parser<http::file_body>>(std::move(parser_empty()));
        return *std::get<file_parser_t>(parser);
    }

    http::request_parser<http::buffer_body> &parser_buffer() {
        if (auto *p = std::get_if<buffer_parser_t>(&parser))
            return *p->get();
        parser = std::make_unique<http::request_parser<http::buffer_body>>(std::move(parser_empty()));
        return *std::get<buffer_parser_t>(parser);
    }

private:
    std::unordered_map<std::string, std::any> vars;

    using empty_parser_t  = http::request_parser<http::empty_body>;
    using string_parser_t = std::unique_ptr<http::request_parser<http::string_body>>;
    using file_parser_t   = std::unique_ptr<http::request_parser<http::file_body>>;
    using buffer_parser_t = std::unique_ptr<http::request_parser<http::buffer_body>>;

    std::variant<empty_parser_t, string_parser_t, file_parser_t, buffer_parser_t> parser;

    std::variant<
        http::response<http::empty_body>,
        http::response<http::string_body>,
        http::response<http::file_body>,
        http::response<http::buffer_body>
    >
        response;

    std::vector<std::function<awaitable<void>(Context &)>> handlers;
    size_t                                                 idx = 0;
};
