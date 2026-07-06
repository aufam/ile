module;

#include <boost/system/error_code.hpp>
#include <boost/system/system_error.hpp>

export module ile:boost;
export import :asio;
export import :beast;
export import :tcp;

export namespace boost::system {
    using ::boost::system::error_code;
    using ::boost::system::system_error;
} // namespace boost::system
