import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import SalaryTax from './pages/SalaryTax';
import FamilyIncome from './pages/FamilyIncome';
import Expenses from './pages/Expenses';
import EMICalculator from './pages/EMICalculator';
import Prepayment from './pages/Prepayment';
import Assets from './pages/Assets';
import Auth from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="salary" element={<SalaryTax />} />
          <Route path="family-income" element={<FamilyIncome />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="emi" element={<EMICalculator />} />
          <Route path="prepayment" element={<Prepayment />} />
          <Route path="assets" element={<Assets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
