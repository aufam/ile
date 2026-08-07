#include <boost/asio.hpp>
#include <boost/beast.hpp>
#include <boost/url.hpp>

namespace asio  = boost::asio;
namespace beast = boost::beast;
namespace http  = boost::beast::http;
namespace ws    = boost::beast::websocket;

using tcp                 = boost::asio::ip::tcp;
using ws_stream           = ws::stream<tcp::socket>;
using http_request        = boost::beast::http::request<boost::beast::http::string_body>;
using http_response       = boost::beast::http::response<boost::beast::http::string_body>;
using http_request_file   = boost::beast::http::request<boost::beast::http::file_body>;
using http_response_file  = boost::beast::http::response<boost::beast::http::file_body>;
using http_request_empty  = boost::beast::http::request<boost::beast::http::empty_body>;
using http_response_empty = boost::beast::http::response<boost::beast::http::empty_body>;
