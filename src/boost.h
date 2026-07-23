#include <boost/asio.hpp>
#include <boost/beast.hpp>

namespace asio  = boost::asio;
namespace beast = boost::beast;
namespace http  = boost::beast::http;
namespace ws    = boost::beast::websocket;

using tcp           = boost::asio::ip::tcp;
using http_request  = boost::beast::http::request<boost::beast::http::string_body>;
using http_response = boost::beast::http::response<boost::beast::http::string_body>;
