const ADMIN_PASSWORD = "Ntombi2026";
const STORAGE_KEY = "healthSweetsNtombiAdmin";

const products = [
  {
    id: "daily",
    name: "Daily Collection",
    items: "GRW, NRM, SLD, STP, GTS, RLX, PWR Lemon, PWR Apricot",
    retail: 862.5,
    wholesale: 431.25,
    startingStock: 10
  },
  {
    id: "premium",
    name: "Premium Collection",
    items: "MLS, ALT, ICE, HRT, HPR, LFT",
    retail: 1293.75,
    wholesale: 1035,
    startingStock: 10
  },
  {
    id: "elite",
    name: "Elite Collection",
    items: "BRN, HPY, AIR, BTY",
    retail: 1725,
    wholesale: 1380,
    startingStock: 10
  },
  {
    id: "pft",
    name: "PFT",
    items: "PFT",
    retail: 1863,
    wholesale: 1552.5,
    startingStock: 10
  }
];

const money = (value) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const defaultData = () => ({
  orders: [],
  leads: [],
  funds: [],
  stock: Object.fromEntries(products.map((product) => [product.id, product.startingStock])),
  outOfStock: {}
});

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData();

  try {
    const parsed = JSON.parse(saved);
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      funds: Array.isArray(parsed.funds) ? parsed.funds : [],
      stock: { ...Object.fromEntries(products.map((product) => [product.id, product.startingStock])), ...(parsed.stock || {}) },
      outOfStock: parsed.outOfStock || {}
    };
  } catch {
    return defaultData();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function stockCount(productId) {
  return Number(state.stock?.[productId] || 0);
}

function isSoldOut(productId) {
  return Boolean(state.outOfStock?.[productId]) || stockCount(productId) <= 0;
}

function loginAdmin() {
  const input = document.querySelector("#adminPassword");
  const message = document.querySelector("#loginMessage");

  if (input.value === ADMIN_PASSWORD) {
    document.querySelector("#adminLogin").classList.add("hidden");
    document.querySelector("#dashboard").classList.remove("hidden");
    renderDashboard();
    return;
  }

  message.textContent = "Incorrect password.";
}

function renderDashboard() {
  renderProductSelect();
  renderMetrics();
  renderFunds();
  renderStock();
  renderOrders();
  renderLeads();
}

function renderProductSelect() {
  const select = document.querySelector("#orderProduct");
  if (!select || select.options.length) return;

  select.innerHTML = products.map((product) => (
    `<option value="${product.id}">${product.name} - ${money(product.retail)}</option>`
  )).join("");
}

function renderMetrics() {
  const income = state.funds.filter((fund) => fund.type === "income").reduce((sum, fund) => sum + Number(fund.amount), 0);
  const expenses = state.funds.filter((fund) => fund.type === "expense").reduce((sum, fund) => sum + Number(fund.amount), 0);

  document.querySelector("#metricIncome").textContent = money(income);
  document.querySelector("#metricExpenses").textContent = money(expenses);
  document.querySelector("#metricNet").textContent = money(income - expenses);
  document.querySelector("#metricLeads").textContent = state.leads.length;
}

function renderFunds() {
  const list = document.querySelector("#fundList");
  list.innerHTML = state.funds.slice(0, 8).map((fund) => `
    <article>
      <strong>${fund.type === "income" ? "Income" : "Expense"}: ${money(fund.amount)}</strong>
      <span>${fund.note || "No note"} | ${new Date(fund.createdAt).toLocaleDateString("en-ZA")}</span>
    </article>
  `).join("") || "<p>No fund records yet.</p>";
}

function renderStock() {
  const list = document.querySelector("#stockList");
  list.innerHTML = products.map((product) => `
    <div class="stock-item">
      <div>
        <strong>${product.name}</strong>
        <span>Retail: ${money(product.retail)} | Wholesale: ${money(product.wholesale)}</span>
        <span>${product.items}</span>
        <span class="${isSoldOut(product.id) ? "sold-out-text" : "in-stock-text"}">${isSoldOut(product.id) ? "Sold out" : "In stock"}</span>
      </div>
      <label>
        Stock
        <input type="number" min="0" value="${stockCount(product.id)}" data-stock-id="${product.id}">
      </label>
      <label class="stock-toggle">
        <input type="checkbox" data-stock-out="${product.id}" ${isSoldOut(product.id) ? "checked" : ""}>
        Out of stock
      </label>
      <button class="btn btn-secondary" type="button" data-stock-save="${product.id}">Save</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-stock-save]").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.stockSave;
      const stockInput = list.querySelector(`[data-stock-id="${productId}"]`);
      const outInput = list.querySelector(`[data-stock-out="${productId}"]`);
      state.stock[productId] = Math.max(0, Number(stockInput.value || 0));
      state.outOfStock[productId] = Boolean(outInput.checked) || state.stock[productId] <= 0;
      saveState();
      renderDashboard();
      document.querySelector("#stockMessage").textContent = `${productById(productId).name} stock saved.`;
    });
  });
}

function renderOrders() {
  const table = document.querySelector("#ordersTable");
  table.innerHTML = state.orders.map((order) => `
    <tr>
      <td><strong>${order.id}</strong><br>${new Date(order.createdAt).toLocaleString("en-ZA")}</td>
      <td><strong>${order.customerName}</strong><br>${order.phone}<br>${order.paymentStatus}</td>
      <td>${order.quantity} x ${order.productName}</td>
      <td><strong>${money(order.total)}</strong><br>Delivery included</td>
      <td>${order.deliveryDetails || "PEP delivery, 2 to 3 days"}</td>
      <td>
        <select data-order-status="${order.id}">
          ${["New", "Paid upfront", "Packed", "Sent via PEP", "Delivered", "Cancelled"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6">No orders recorded yet.</td></tr>`;

  table.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const order = state.orders.find((item) => item.id === select.dataset.orderStatus);
      order.status = select.value;
      saveState();
      renderOrders();
    });
  });
}

function renderLeads() {
  const table = document.querySelector("#leadsTable");
  table.innerHTML = state.leads.map((lead) => `
    <tr>
      <td>${new Date(lead.createdAt).toLocaleDateString("en-ZA")}</td>
      <td><strong>${lead.name}</strong></td>
      <td>${lead.phone}</td>
      <td>${lead.interest}</td>
      <td>${lead.notes || ""}</td>
      <td>
        <select data-lead-status="${lead.id}">
          ${["New", "Contacted", "Training booked", "Joined", "Not interested"].map((status) => `<option ${status === lead.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6">No distributor leads recorded yet.</td></tr>`;

  table.querySelectorAll("[data-lead-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const lead = state.leads.find((item) => item.id === select.dataset.leadStatus);
      lead.status = select.value;
      saveState();
      renderLeads();
    });
  });
}

function handleOrderSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const product = productById(formData.get("productId"));
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const message = document.querySelector("#orderMessage");

  if (isSoldOut(product.id) || quantity > stockCount(product.id)) {
    message.textContent = `Only ${stockCount(product.id)} ${product.name} available.`;
    return;
  }

  const total = product.retail * quantity;
  const order = {
    id: `HSN-${1000 + state.orders.length + 1}`,
    createdAt: new Date().toISOString(),
    customerName: formData.get("customerName").trim(),
    phone: formData.get("phone").trim(),
    productId: product.id,
    productName: product.name,
    quantity,
    paymentStatus: formData.get("paymentStatus"),
    deliveryDetails: formData.get("deliveryDetails").trim(),
    total,
    status: formData.get("paymentStatus")
  };

  state.orders.unshift(order);
  state.stock[product.id] = Math.max(0, stockCount(product.id) - quantity);
  state.outOfStock[product.id] = state.stock[product.id] <= 0;

  if (order.paymentStatus === "Paid upfront") {
    state.funds.unshift({
      id: crypto.randomUUID(),
      type: "income",
      amount: total,
      note: `Order ${order.id} - ${product.name}`,
      createdAt: new Date().toISOString()
    });
  }

  saveState();
  form.reset();
  message.textContent = `${order.id} saved. Total paid: ${money(total)}.`;
  renderDashboard();
}

function handleLeadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  state.leads.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: formData.get("name").trim(),
    phone: formData.get("phone").trim(),
    interest: formData.get("interest"),
    notes: formData.get("notes").trim(),
    status: "New"
  });
  saveState();
  form.reset();
  renderDashboard();
}

function handleExpenseSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  state.funds.unshift({
    id: crypto.randomUUID(),
    type: "expense",
    amount: Number(formData.get("amount")),
    note: formData.get("note").trim(),
    createdAt: new Date().toISOString()
  });
  saveState();
  form.reset();
  renderDashboard();
}

function exportCsv(type) {
  const isOrders = type === "orders";
  const rows = isOrders
    ? [["Order ID", "Date", "Customer", "Phone", "Product", "Quantity", "Total", "Payment", "PEP Delivery", "Status"], ...state.orders.map((order) => [
      order.id, new Date(order.createdAt).toLocaleString("en-ZA"), order.customerName, order.phone, order.productName, order.quantity, order.total, order.paymentStatus, order.deliveryDetails, order.status
    ])]
    : [["Date", "Name", "Phone", "Interest", "Notes", "Status"], ...state.leads.map((lead) => [
      new Date(lead.createdAt).toLocaleString("en-ZA"), lead.name, lead.phone, lead.interest, lead.notes, lead.status
    ])];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `health-sweets-ntombi-${type}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearData() {
  if (!confirm("Clear all admin orders, leads, funds and stock changes?")) return;
  state = defaultData();
  saveState();
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#loginBtn").addEventListener("click", loginAdmin);
  document.querySelector("#adminPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") loginAdmin();
  });
  document.querySelector("#orderForm").addEventListener("submit", handleOrderSubmit);
  document.querySelector("#leadForm").addEventListener("submit", handleLeadSubmit);
  document.querySelector("#expenseForm").addEventListener("submit", handleExpenseSubmit);
  document.querySelector("#exportOrdersBtn").addEventListener("click", () => exportCsv("orders"));
  document.querySelector("#exportLeadsBtn").addEventListener("click", () => exportCsv("leads"));
  document.querySelector("#clearDataBtn").addEventListener("click", clearData);
});
