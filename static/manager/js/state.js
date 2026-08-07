// ==================== STATE MANAGEMENT & DUMMY DATA ====================
const MANAGER_SESSION_KEY = 'ile_manager_session';

let currentManagerSession = {
  branch: 'Jakarta Barat',
  date: new Date().toISOString().split('T')[0]
};

let managerTicketsData = [
  {
    id: "ticket-1001",
    branch: "Jakarta Barat",
    counter: "Counter #01",
    staff_name: "Jane Doe (Appraiser)",
    customer_name: "Budi Santoso",
    customer_queue_number: "Q-001",
    date: "2026-08-07",
    status: "Approved",
    manager_notes: "Assay and XRF verified. Approved for instant payout.",
    signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><path d='M10 40 Q 50 10 90 40 T 170 30' stroke='%230f172a' stroke-width='3' fill='none'/></svg>",
    items: [
      {
        id: "item-101",
        title: "24K Gold Bar (Antam 10g)",
        photo: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80",
        weighing_photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
        xrf_photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        weight: 10.00,
        carat: 24,
        price_per_gram: 1350000,
        total_price: 13500000,
        status: "Approved",
        notes: "Pure 999.9 gold ingot."
      },
      {
        id: "item-102",
        title: "18K Gold Ring with Diamond Accent",
        photo: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80",
        weighing_photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
        xrf_photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        weight: 4.25,
        carat: 18,
        price_per_gram: 1012500,
        total_price: 4303125,
        status: "Approved",
        notes: "XRF purity 75.2% Au."
      }
    ]
  },
  {
    id: "ticket-1002",
    branch: "Jakarta Barat",
    counter: "Counter #02",
    staff_name: "Alex Rivera (Appraiser)",
    customer_name: "Siti Rahma",
    customer_queue_number: "Q-002",
    date: "2026-08-07",
    status: "In Measurement",
    manager_notes: "Awaiting customer final signature.",
    signature: null,
    items: [
      {
        id: "item-103",
        title: "22K Solid Gold Necklace",
        photo: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80",
        weighing_photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
        xrf_photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        weight: 15.80,
        carat: 22,
        price_per_gram: 1237500,
        total_price: 19552500,
        status: "In Measurement",
        notes: "Assayed 91.6% Au purity."
      }
    ]
  },
  {
    id: "ticket-1003",
    branch: "Jakarta Barat",
    counter: "Counter #03",
    staff_name: "Sarah Chen (Appraiser)",
    customer_name: "Dewi Lestari",
    customer_queue_number: "Q-003",
    date: "2026-08-06",
    status: "Completed",
    manager_notes: "Payment disbursed via bank transfer.",
    signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><path d='M10 30 C 40 10, 65 50, 95 30 S 150 50, 180 20' stroke='%230f172a' stroke-width='3' fill='none'/></svg>",
    items: [
      {
        id: "item-104",
        title: "14K Gold Bracelet",
        photo: "https://images.unsplash.com/photo-1611591475143-be232938f429?auto=format&fit=crop&w=400&q=80",
        weighing_photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
        xrf_photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        weight: 8.50,
        carat: 14,
        price_per_gram: 787500,
        total_price: 6693750,
        status: "Completed",
        notes: "Purity 58.5% Au."
      }
    ]
  },
  {
    id: "ticket-1004",
    branch: "Tanjung Barat",
    counter: "Counter #01",
    staff_name: "Michael Tan (Appraiser)",
    customer_name: "Hendra Wijaya",
    customer_queue_number: "Q-004",
    date: "2026-08-07",
    status: "Approved",
    manager_notes: "VIP Client. Instant appraisal completed.",
    signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><path d='M10 20 L 50 50 L 90 20 L 130 50 L 170 10' stroke='%230f172a' stroke-width='3' fill='none'/></svg>",
    items: [
      {
        id: "item-105",
        title: "24K Gold Coin 5g",
        photo: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80",
        weighing_photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
        xrf_photo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        weight: 5.00,
        carat: 24,
        price_per_gram: 1350000,
        total_price: 6750000,
        status: "Approved",
        notes: "Gold coin verified."
      }
    ]
  }
];

let activeTicketId = "ticket-1001";

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function getActiveTicket() {
  return managerTicketsData.find(t => t.id === activeTicketId) || managerTicketsData[0];
}
