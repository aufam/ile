module;

#include <fstream>
#include "../boost.h"

module ile;

asio::awaitable<void> ile::Session::handle_http(const http_request &req) {
    co_await router.handle(socket, req);
}
