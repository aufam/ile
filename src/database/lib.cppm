module;

#include <string_view>

export module ile:database;
import cpx.sql;

namespace ile::database {
    struct Item;
    struct Ticket;
} // namespace ile::database

using cpx::sql::Column;

struct ile::database::Item {
    static constexpr const char *TableName = "items";

    Column<Item, long long>        id             = "id integer primary key";
    Column<Item, long long>        ticket_id      = "ticket_id integer not null references tickets(id) on delete cascade";
    Column<Item, std::string_view> title          = "title text";
    Column<Item, std::string_view> photo          = "photo text";
    Column<Item, std::string_view> weighing_photo = "weighing_photo text";
    Column<Item, std::string_view> xrf_photo      = "xrf_photo text";
    Column<Item, std::string_view> weight         = "weight text";
    Column<Item, std::string_view> carat          = "carat text";
    Column<Item, double>           price_per_gram = "price_per_gram real";
    Column<Item, double>           total_price    = "total_price real";
};

struct ile::database::Ticket {
    static constexpr const char *TableName = "tickets";

    Column<Ticket, int>              id            = "id integer primary key";
    Column<Ticket, std::string_view> branch        = "branch text";
    Column<Ticket, std::string_view> counter       = "counter text";
    Column<Ticket, std::string_view> staff_name    = "staff_name text";
    Column<Ticket, std::string_view> customer_name = "customer_name text";
    Column<Ticket, std::string_view> queue_number  = "queue_number text";
    Column<Ticket, std::string_view> date          = "date text";
    Column<Ticket, std::string_view> status        = "status text";
    Column<Ticket, std::string_view> signature     = "signature text";
};
