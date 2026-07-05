module;

#include <iostream>
#include <memory>
#include <set>
#include <string>
#include <fstream>
#include <chrono>
#include <array>
#include <cstring>
#include <vector>

export module ile:std;

export namespace std {
    using ::std::array;
    using ::std::cerr;
    using ::std::cout;
    using ::std::enable_shared_from_this;
    using ::std::endl;
    using ::std::exception;
    using ::std::flush;
    using ::std::forward;
    using ::std::fstream;
    using ::std::ifstream;
    using ::std::ignore;
    using ::std::ios;
    using ::std::iostream;
    using ::std::istream;
    using ::std::istreambuf_iterator;
    using ::std::make_shared;
    using ::std::make_unique;
    using ::std::memcmp;
    using ::std::memcpy;
    using ::std::move;
    using ::std::ofstream;
    using ::std::ostream;
    using ::std::runtime_error;
    using ::std::set;
    using ::std::shared_ptr;
    using ::std::streamsize;
    using ::std::string;
    using ::std::string_view;
    using ::std::tie;
    using ::std::tuple;
    using ::std::tuple_cat;
    using ::std::unique_ptr;
    using ::std::vector;

    using ::std::operator<<;
    using ::std::operator>>;
    using ::std::operator+;
    using ::std::operator==;
} // namespace std

export namespace std::chrono {
    using ::std::chrono::hours;
    using ::std::chrono::microseconds;
    using ::std::chrono::milliseconds;
    using ::std::chrono::minutes;
    using ::std::chrono::nanoseconds;
    using ::std::chrono::seconds;
} // namespace std::chrono

export using std::literals::operator""ns;
export using std::literals::operator""us;
export using std::literals::operator""s;
export using std::literals::operator""ms;
export using std::literals::operator""min;
export using std::literals::operator""h;
export using std::string_view_literals::operator""sv;
