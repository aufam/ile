module;

#include <string>
#include <vector>
#include <tuple>

export module ile:database;
import cpx;
import cpx.sql;

export namespace ile {
    struct Item;
    struct Ticket;
} // namespace ile

namespace ile::database {
    struct Item;
    struct Ticket;
} // namespace ile::database

using cpx::sql::Column;

struct ile::Item {
    long long   id        = 0;
    long long   ticket_id = 0;
    std::string title;
    std::string photo;
    std::string weighing_photo;
    std::string xrf_photo;
    double      weight = 0;
    std::string carat;
    std::string price_type;
    double      price_per_gram = 0;
    double      total_price    = 0;

    static constexpr std::tuple __field_tags__ = {
        cpx::field<&Item::id>             = "id,skipmissing",
        cpx::field<&Item::ticket_id>      = "ticket_id,skipmissing",
        cpx::field<&Item::title>          = "title",
        cpx::field<&Item::photo>          = "photo,skipmissing",
        cpx::field<&Item::weighing_photo> = "weighing_photo,skipmissing",
        cpx::field<&Item::xrf_photo>      = "xrf_photo,skipmissing",
        cpx::field<&Item::weight>         = "weight",
        cpx::field<&Item::carat>          = "carat",
        cpx::field<&Item::price_type>     = "price_type",
        cpx::field<&Item::price_per_gram> = "price_per_gram",
        cpx::field<&Item::total_price>    = "total_price",
    };
};

struct ile::Ticket {
    long long   id = 0;
    std::string office;
    std::string counter;
    std::string staff_name;
    std::string customer_name;
    std::string customer_queue_number;
    std::string date;
    std::string status;
    std::string signature;

    std::vector<ile::Item> items;

    static constexpr std::tuple __field_tags__ = {
        cpx::field<&Ticket::id>                    = "id,skipmissing",
        cpx::field<&Ticket::office>                = "office",
        cpx::field<&Ticket::counter>               = "counter",
        cpx::field<&Ticket::staff_name>            = "staff_name",
        cpx::field<&Ticket::customer_name>         = "customer_name",
        cpx::field<&Ticket::customer_queue_number> = "customer_queue_number",
        cpx::field<&Ticket::date>                  = "date",
        cpx::field<&Ticket::status>                = "status",
        cpx::field<&Ticket::signature>             = "signature,skipmissing",
        cpx::field<&Ticket::items>                 = "items,skipmissing",
    };
};

struct ile::database::Item {
    static constexpr const char *TableName = "items";

    Column<Item, long long>   id             = "id integer primary key";
    Column<Item, long long>   ticket_id      = "ticket_id integer not null references tickets(id) on delete cascade";
    Column<Item, std::string> title          = "title text default ''";
    Column<Item, std::string> photo          = "photo text default ''";
    Column<Item, std::string> weighing_photo = "weighing_photo text default ''";
    Column<Item, std::string> xrf_photo      = "xrf_photo text default ''";
    Column<Item, double>      weight         = "weight real default 0";
    Column<Item, std::string> carat          = "carat real default ''";
    Column<Item, std::string> price_type     = "price_type text default ''";
    Column<Item, double>      price_per_gram = "price_per_gram real default 0";
    Column<Item, double>      total_price    = "total_price real default 0";
};

struct ile::database::Ticket {
    static constexpr const char *TableName = "tickets";

    Column<Ticket, long long>   id                    = "id integer primary key";
    Column<Ticket, std::string> office                = "office text default ''";
    Column<Ticket, std::string> counter               = "counter text default ''";
    Column<Ticket, std::string> staff_name            = "staff_name text default ''";
    Column<Ticket, std::string> customer_name         = "customer_name text default ''";
    Column<Ticket, std::string> customer_queue_number = "customer_queue_number text default ''";
    Column<Ticket, std::string> date                  = "date text default ''";
    Column<Ticket, std::string> status                = "status text default ''";
    Column<Ticket, std::string> signature             = "signature text default ''";
};

namespace ile::database {
    export constexpr Item   items;
    export constexpr Ticket tickets;
} // namespace ile::database
