module;

#include <string>

export module ile:database;
import cpx.sql;

namespace ile::database {
    struct Item;
    struct Ticket;
} // namespace ile::database

using cpx::sql::Column;

struct ile::database::Item {
    static constexpr const char *TableName = "items";

    Column<Item, long long>   id             = "id integer primary key";
    Column<Item, long long>   ticket_id      = "ticket_id integer not null references tickets(id) on delete cascade";
    Column<Item, std::string> title          = "title text default ''";
    Column<Item, std::string> photo          = "photo text default ''";
    Column<Item, std::string> weighing_photo = "weighing_photo text default ''";
    Column<Item, std::string> xrf_photo      = "xrf_photo text default ''";
    Column<Item, std::string> weight         = "weight text default ''";
    Column<Item, std::string> carat          = "carat text default ''";
    Column<Item, double>      price_per_gram = "price_per_gram real default 0";
    Column<Item, double>      total_price    = "total_price real default 0";
};

struct ile::database::Ticket {
    static constexpr const char *TableName = "tickets";

    Column<Ticket, int>         id                    = "id integer primary key";
    Column<Ticket, std::string> office                = "office text default ''";
    Column<Ticket, std::string> counter               = "counter text default ''";
    Column<Ticket, std::string> staff_name            = "staff_name text default ''";
    Column<Ticket, std::string> customer_name         = "customer_name text default ''";
    Column<Ticket, std::string> customer_queue_number = "customer_queue_number text default ''";
    Column<Ticket, std::string> queue_number          = "queue_number text default ''";
    Column<Ticket, std::string> date                  = "date text default ''";
    Column<Ticket, std::string> status                = "status text default ''";
    Column<Ticket, std::string> signature             = "signature text default ''";
};

namespace ile::database {
    export constexpr Item   items;
    export constexpr Ticket tickets;
} // namespace ile::database
