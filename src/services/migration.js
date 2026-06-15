import { getSupabaseClient } from '../lib/supabaseClient';

/**
 * Migrates parsed sheets data (months, salaries, Udaipur, dues) directly to Supabase.
 * Clears existing database entries first to ensure a clean migration.
 */
export async function migrateSheetsToSupabase(data) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { monthsData, salaryData, udaipurData, duesData } = data;

  // 1. Clear existing database tables in correct dependency order
  // (We delete dependent tables first to avoid reference errors)
  console.log('Clearing old database entries...');
  await Promise.all([
    supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('salaries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('udaipur_trip').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('dues_lended').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('dues_lalumama').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('dues_others').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('credits').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('dues_dishank').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  ]);

  // Now clear the months table
  await supabase.from('months').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Inserting months and expenses...');
  // 2. Insert months and their respective categories
  if (monthsData && monthsData.length > 0) {
    for (const m of monthsData) {
      const { data: monthRow, error: monthErr } = await supabase
        .from('months')
        .insert({
          label: m.label,
          income: m.income,
          savings: m.savings,
          virat: m.virat,
          me: m.me
        })
        .select('id')
        .single();

      if (monthErr) throw monthErr;

      const expensePayloads = Object.entries(m.categories || {}).map(([category, amount]) => ({
        month_id: monthRow.id,
        category,
        amount
      }));

      if (expensePayloads.length > 0) {
        const { error: expErr } = await supabase.from('expenses').insert(expensePayloads);
        if (expErr) throw expErr;
      }
    }
  }

  // 3. Insert salaries
  console.log('Inserting salaries...');
  if (salaryData && salaryData.length > 0) {
    const salariesPayload = salaryData.map(s => ({
      year: s.year,
      salary: s.salary
    }));
    const { error: salErr } = await supabase.from('salaries').insert(salariesPayload);
    if (salErr) throw salErr;
  }

  // 4. Insert Udaipur Trip
  console.log('Inserting Udaipur trip expenses...');
  if (udaipurData) {
    const tripPayloads = [];
    
    (udaipurData.myExpenses || []).forEach(item => {
      tripPayloads.push({ label: item.label, amount: item.amount, type: 'my' });
    });
    (udaipurData.combinedExpenses || []).forEach(item => {
      tripPayloads.push({ label: item.label, amount: item.amount, type: 'combined' });
    });
    (udaipurData.viratExpenses || []).forEach(item => {
      tripPayloads.push({ label: item.label, amount: item.amount, type: 'virat' });
    });

    if (tripPayloads.length > 0) {
      const { error: tripErr } = await supabase.from('udaipur_trip').insert(tripPayloads);
      if (tripErr) throw tripErr;
    }
  }

  // 5. Insert Dues & Accounts
  console.log('Inserting dues, payables, and credit card accounts...');
  if (duesData) {
    // Lent items
    if (duesData.lended && duesData.lended.items && duesData.lended.items.length > 0) {
      const lendedPayloads = duesData.lended.items.map(item => ({
        name: item.name,
        amount: item.amount
      }));
      const { error: lendErr } = await supabase.from('dues_lended').insert(lendedPayloads);
      if (lendErr) throw lendErr;
    }

    // Dishank Shortfall
    if (duesData.dishank) {
      const dishankPayload = {
        should_be: duesData.dishank.shouldBe,
        currently_there: duesData.dishank.currentlyThere,
        difference: duesData.dishank.difference
      };
      const { error: dishankErr } = await supabase.from('dues_dishank').insert(dishankPayload);
      if (dishankErr) throw dishankErr;
    } else {
      // Create empty record if none exists
      await supabase.from('dues_dishank').insert({ should_be: 0, currently_there: 0, difference: 0 });
    }

    // Lalumama Installments
    if (duesData.dues && duesData.dues.lalumamaInstallments && duesData.dues.lalumamaInstallments.length > 0) {
      const lalumamaPayloads = duesData.dues.lalumamaInstallments.map(inst => ({
        date: inst.date,
        amount: inst.amount
      }));
      const { error: lalErr } = await supabase.from('dues_lalumama').insert(lalumamaPayloads);
      if (lalErr) throw lalErr;
    }

    // Others Payables
    if (duesData.dues && duesData.dues.others && duesData.dues.others.length > 0) {
      const othersPayloads = duesData.dues.others.map(item => ({
        name: item.name,
        amount: item.amount
      }));
      const { error: othersErr } = await supabase.from('dues_others').insert(othersPayloads);
      if (othersErr) throw othersErr;
    }

    // Credit Card accounts
    if (duesData.credit && duesData.credit.length > 0) {
      const creditPayloads = duesData.credit.map(item => ({
        name: item.name,
        amount: item.amount
      }));
      const { error: creditErr } = await supabase.from('credits').insert(creditPayloads);
      if (creditErr) throw creditErr;
    }
  }

  console.log('Migration successfully completed!');
}
