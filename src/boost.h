#include <boost/asio.hpp>
#include <boost/beast.hpp>
#include <boost/url.hpp>

namespace asio  = boost::asio;
namespace beast = boost::beast;
namespace http  = boost::beast::http;
namespace ws    = boost::beast::websocket;
namespace urls  = boost::urls;

using boost::asio::awaitable;
using boost::asio::ip::tcp;
using boost::beast::tcp_stream;
using ws_stream = ws::stream<tcp_stream>;
