import { getSupabaseClient } from '../lib/supabaseClient';

/**
 * Helper to get the client or throw an error if not configured
 */
function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Please set your credentials in Settings.');
  }
  return client;
}

/**
 * Fetches all financial dashboard data from Supabase and aggregates/formats it
 * to match the front-end structure.
 */
export async function fetchFullDashboardData() {
  const supabase = getClient();

  // Parallel fetches for efficiency
  const [
    { data: months, error: monthsErr },
    { data: expenses, error: expErr },
    { data: salaries, error: salErr },
    { data: udaipur, error: udaipurErr },
    { data: lended, error: lendedErr },
    { data: dishank, error: dishankErr },
    { data: lalumama, error: lalumamaErr },
    { data: others, error: othersErr },
    { data: credits, error: creditsErr }
  ] = await Promise.all([
    supabase.from('months').select('*').order('created_at', { ascending: true }),
    supabase.from('expenses').select('*'),
    supabase.from('salaries').select('*').order('year', { ascending: true }),
    supabase.from('udaipur_trip').select('*').order('created_at', { ascending: true }),
    supabase.from('dues_lended').select('*').order('created_at', { ascending: true }),
    supabase.from('dues_dishank').select('*').limit(1),
    supabase.from('dues_lalumama').select('*').order('created_at', { ascending: true }),
    supabase.from('dues_others').select('*').order('created_at', { ascending: true }),
    supabase.from('credits').select('*').order('created_at', { ascending: true })
  ]);

  if (monthsErr) throw monthsErr;
  if (expErr) throw expErr;
  if (salErr) throw salErr;
  if (udaipurErr) throw udaipurErr;
  if (lendedErr) throw lendedErr;
  if (dishankErr) throw dishankErr;
  if (lalumamaErr) throw lalumamaErr;
  if (othersErr) throw othersErr;
  if (creditsErr) throw creditsErr;

  // 1. Map months and expenses
  const monthsMap = {};
  const formattedMonths = (months || []).map(m => {
    const monthObj = {
      id: m.id,
      label: m.label,
      income: Number(m.income),
      savings: Number(m.savings),
      virat: Number(m.virat),
      me: Number(m.me),
      categories: {},
      totalExpense: 0
    };
    monthsMap[m.id] = monthObj;
    return monthObj;
  });

  (expenses || []).forEach(e => {
    if (monthsMap[e.month_id]) {
      const amt = Number(e.amount);
      monthsMap[e.month_id].categories[e.category] = (monthsMap[e.month_id].categories[e.category] || 0) + amt;
    }
  });

  // Calculate totalExpense for each month
  formattedMonths.forEach(m => {
    m.totalExpense = Object.values(m.categories).reduce((sum, val) => sum + val, 0);
  });

  // 2. Map Salary History
  const formattedSalaries = (salaries || []).map(s => ({
    id: s.id,
    year: Number(s.year),
    salary: Number(s.salary)
  }));

  // 3. Map Udaipur Trip
  const myExpenses = [];
  const combinedExpenses = [];
  const viratExpenses = [];

  (udaipur || []).forEach(item => {
    const formattedItem = { id: item.id, label: item.label, amount: Number(item.amount) };
    if (item.type === 'my') myExpenses.push(formattedItem);
    else if (item.type === 'combined') combinedExpenses.push(formattedItem);
    else if (item.type === 'virat') viratExpenses.push(formattedItem);
  });

  const myTotal = myExpenses.reduce((sum, i) => sum + i.amount, 0);
  const combinedTotal = combinedExpenses.reduce((sum, i) => sum + i.amount, 0);
  const viratTotal = viratExpenses.reduce((sum, i) => sum + i.amount, 0);

  const udaipurData = {
    title: (udaipur && udaipur.length > 0) ? "Udaipur Trip March 2025" : "Udaipur Trip Details",
    myExpenses,
    combinedExpenses,
    viratExpenses,
    myTotal,
    combinedTotal,
    viratTotal,
    splitAmount: combinedTotal / 2,
    grandTotal: myTotal + combinedTotal + viratTotal
  };

  // 4. Map Dues & Accounts
  const lendedItems = (lended || []).map(l => ({ id: l.id, name: l.name, amount: Number(l.amount) }));
  const lendedTotal = lendedItems.reduce((sum, i) => sum + i.amount, 0);

  const dishankRecord = (dishank && dishank[0]) || { should_be: 0, currently_there: 0, difference: 0 };
  const dishankData = {
    id: dishankRecord.id,
    shouldBe: Number(dishankRecord.should_be),
    currentlyThere: Number(dishankRecord.currently_there),
    difference: Number(dishankRecord.difference)
  };

  const lalumamaInstallments = (lalumama || []).map(lm => ({ id: lm.id, date: lm.date, amount: Number(lm.amount) }));
  const lalumamaTotal = lalumamaInstallments.reduce((sum, i) => sum + i.amount, 0);

  const othersPayables = (others || []).map(o => ({ id: o.id, name: o.name, amount: Number(o.amount) }));
  const othersTotal = othersPayables.reduce((sum, i) => sum + i.amount, 0);

  // In our scheme:
  // - lalumamaRemains = 65000 (starting total) - lalumamaTotal (already paid)
  // Let's make lalumamaRemains dynamic based on what is in dishank/shortfall or keep it custom
  // Standard lalumama total amount is usually 65000. Let's look at the default records in App.jsx.
  // In App.jsx: lalumamaTotal is 52000 (payments made), and lalumamaRemains is 13000 (remaining).
  // Total was 65000. Let's dynamically compute remains if we assume a base of 65000, or let's read the
  // first row of dues_dishank/some table or let the remaining balance be defined directly.
  // Wait, let's keep the remains calculation matching the sheet: lalumamaRemains is from cell H15 in the sheet.
  // Since we want to store it in Supabase, we can check if the row has a specific lalumama remains field or if we
  // just sum up installments. Actually, in the sheets: lalumamaRemains = 65000 - lalumamaTotal.
  // Let's compute remains as: Max(0, 65000 - lalumamaTotal).
  const lalumamaRemains = Math.max(0, 65000 - lalumamaTotal);

  const creditItems = (credits || []).map(c => ({ id: c.id, name: c.name, amount: Number(c.amount) }));

  const duesData = {
    title: "Dues & Accounts Summary",
    lended: {
      total: lendedTotal,
      items: lendedItems
    },
    dishank: dishankData,
    dues: {
      lalumamaTotal,
      lalumamaInstallments,
      lalumamaRemains,
      othersTotal,
      others: othersPayables
    },
    credit: creditItems
  };

  return {
    monthsData: formattedMonths,
    salaryData: formattedSalaries,
    udaipurData,
    duesData
  };
}

/* ==================== CRUD OPERATIONS ==================== */

// --- Months & Expenses CRUD ---
export async function saveMonth(monthData) {
  const supabase = getClient();
  const { id, label, income, savings, virat, me, categories } = monthData;

  let monthId = id;

  // 1. Upsert month entry
  const monthPayload = { label, income, savings, virat, me };
  if (monthId) {
    const { error } = await supabase.from('months').update(monthPayload).eq('id', monthId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('months').insert(monthPayload).select('id').single();
    if (error) throw error;
    monthId = data.id;
  }

  // 2. Replace expenses for this month
  const { error: deleteErr } = await supabase.from('expenses').delete().eq('month_id', monthId);
  if (deleteErr) throw deleteErr;

  const expensePayloads = Object.entries(categories || {}).map(([category, amount]) => ({
    month_id: monthId,
    category,
    amount
  }));

  if (expensePayloads.length > 0) {
    const { error: insertErr } = await supabase.from('expenses').insert(expensePayloads);
    if (insertErr) throw insertErr;
  }

  return monthId;
}

export async function deleteMonth(monthId) {
  const supabase = getClient();
  const { error } = await supabase.from('months').delete().eq('id', monthId);
  if (error) throw error;
}

// --- Salaries CRUD ---
export async function saveSalary(salaryData) {
  const supabase = getClient();
  const { id, year, salary } = salaryData;

  const payload = { year, salary };
  if (id) {
    const { error } = await supabase.from('salaries').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('salaries').insert(payload);
    if (error) throw error;
  }
}

export async function deleteSalary(salaryId) {
  const supabase = getClient();
  const { error } = await supabase.from('salaries').delete().eq('id', salaryId);
  if (error) throw error;
}

// --- Udaipur Trip CRUD ---
export async function saveUdaipurItem(itemData) {
  const supabase = getClient();
  const { id, label, amount, type } = itemData;

  const payload = { label, amount, type };
  if (id) {
    const { error } = await supabase.from('udaipur_trip').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('udaipur_trip').insert(payload);
    if (error) throw error;
  }
}

export async function deleteUdaipurItem(itemId) {
  const supabase = getClient();
  const { error } = await supabase.from('udaipur_trip').delete().eq('id', itemId);
  if (error) throw error;
}

// --- Dues & Accounts CRUD ---
export async function saveLendedItem(itemData) {
  const supabase = getClient();
  const { id, name, amount } = itemData;

  const payload = { name, amount };
  if (id) {
    const { error } = await supabase.from('dues_lended').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('dues_lended').insert(payload);
    if (error) throw error;
  }
}

export async function deleteLendedItem(itemId) {
  const supabase = getClient();
  const { error } = await supabase.from('dues_lended').delete().eq('id', itemId);
  if (error) throw error;
}

export async function saveDishankShortfall(dishankData) {
  const supabase = getClient();
  const { id, shouldBe, currentlyThere } = dishankData;
  const difference = Math.max(0, shouldBe - currentlyThere);

  const payload = { should_be: shouldBe, currently_there: currentlyThere, difference };
  if (id) {
    const { error } = await supabase.from('dues_dishank').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    // If no id, attempt to update the single existing record, or insert
    const { data: existing } = await supabase.from('dues_dishank').select('id').limit(1);
    if (existing && existing.length > 0) {
      const { error } = await supabase.from('dues_dishank').update(payload).eq('id', existing[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('dues_dishank').insert(payload);
      if (error) throw error;
    }
  }
}

export async function saveLalumamaInstallment(instData) {
  const supabase = getClient();
  const { id, date, amount } = instData;

  const payload = { date, amount };
  if (id) {
    const { error } = await supabase.from('dues_lalumama').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('dues_lalumama').insert(payload);
    if (error) throw error;
  }
}

export async function deleteLalumamaInstallment(instId) {
  const supabase = getClient();
  const { error } = await supabase.from('dues_lalumama').delete().eq('id', instId);
  if (error) throw error;
}

export async function saveOthersPayable(otherData) {
  const supabase = getClient();
  const { id, name, amount } = otherData;

  const payload = { name, amount };
  if (id) {
    const { error } = await supabase.from('dues_others').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('dues_others').insert(payload);
    if (error) throw error;
  }
}

export async function deleteOthersPayable(otherId) {
  const supabase = getClient();
  const { error } = await supabase.from('dues_others').delete().eq('id', otherId);
  if (error) throw error;
}

export async function saveCredit(creditData) {
  const supabase = getClient();
  const { id, name, amount } = creditData;

  const payload = { name, amount };
  if (id) {
    const { error } = await supabase.from('credits').update(payload).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('credits').insert(payload);
    if (error) throw error;
  }
}

export async function deleteCredit(creditId) {
  const supabase = getClient();
  const { error } = await supabase.from('credits').delete().eq('id', creditId);
  if (error) throw error;
}
