import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/* ── colour tokens ── */
const themes = {
  dark: {
    bg: '#0f1117', surface: '#1a1d27', card: '#20242f', border: '#2e3347',
    red: '#ef4444', redDk: '#b91c1c', redBg: '#2d0e0e',
    amber: '#f59e0b', amberDk: '#b45309', amberBg: '#2d1f00',
    green: '#22c55e', greenDk: '#15803d', greenBg: '#0d2d1e',
    blue: '#4f8ef7', blueDk: '#1d4ed8', blueBg: '#1e2d4a',
    purple: '#a855f7', purpleDk: '#7e22ce', purpleBg: '#1e0d2e',
    cyan: '#06b6d4', cyanBg: '#0a1f26',
    text: '#e8eaf0', textSec: '#8b90a7', textMuted: '#555b78',
  },
  light: {
    bg: '#f9fafb', surface: '#f3f4f6', card: '#ffffff', border: '#e5e7eb',
    red: '#ef4444', redDk: '#b91c1c', redBg: '#fef2f2',
    amber: '#f59e0b', amberDk: '#b45309', amberBg: '#fffbeb',
    green: '#16a34a', greenDk: '#15803d', greenBg: '#f0fdf4',
    blue: '#3b82f6', blueDk: '#1d4ed8', blueBg: '#eff6ff',
    purple: '#9333ea', purpleDk: '#7e22ce', purpleBg: '#faf5ff',
    cyan: '#06b6d4', cyanBg: '#ecfeff',
    text: '#111827', textSec: '#4b5563', textMuted: '#9ca3af',
  }
};

const getCardStyle = (C) => ({
  background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 18px', shadow: '0 2px 4px rgba(0,0,0,0.02)'
});

/* ── Slider Panel component ── */
function SliderPanel({ predictionResult, formData, C }) {
  const cardStyle = getCardStyle(C);
  
  /* initial values from backend prediction */
  const baseline0 = predictionResult?.wcrs?.r_baseline || 50;
  const formulas = predictionResult?.wcrs?.formulas || {};
  const sbp0 = parseFloat(formData?.systolic_bp || 120);
  const dbp0 = parseFloat(formData?.diastolic_bp || 80);
  const weight0 = parseFloat(formData?.weight || 70);
  const height0 = parseFloat(formData?.height || 170);

  const [baseline, setBaseline] = useState(baseline0);
  const [sbp, setSbp] = useState(sbp0);
  const [dbp, setDbp] = useState(dbp0);
  const [weight, setWeight] = useState(weight0);
  const [height, setHeight] = useState(height0);
  const [hScore, setHScore] = useState(formulas.heredity?.h_score || 0);
  const [metMin, setMetMin] = useState(formulas.activity?.met_weekly || 630);

  /* derived */
  const heightM = height / 100;
  const bmi = heightM > 0 ? (weight / (heightM * heightM)) : 25;
  const map = (sbp + 2 * dbp) / 3;
  const drBP = ((map - 93.3) / 93.3) * 35;
  const drWeight = ((bmi - 25) / 25) * 40;
  const drHeredity = Math.min(hScore, 1.0) * 25;
  const actMod = Math.max(0.5, Math.min(1.2, 1.0 - (0.30 * (metMin - 600) / 600)));
  const rFinal = baseline * (1 + drBP / 100 + drWeight / 100 + drHeredity / 100) * actMod;
  const rFinalClamped = Math.max(0, Math.min(100, rFinal));

  const riskLabel = rFinalClamped >= 65 ? 'High Risk' : rFinalClamped >= 33 ? 'Moderate Risk' : 'Low Risk';
  const riskColor = rFinalClamped >= 65 ? C.red : rFinalClamped >= 33 ? C.amber : C.green;
  const riskBg    = rFinalClamped >= 65 ? C.redBg : rFinalClamped >= 33 ? C.amberBg : C.greenBg;

  const compositeFormula = `R_final = ${baseline.toFixed(0)}% × (1 + ${(drBP/100).toFixed(3)} + ${(drWeight/100).toFixed(3)} + ${(drHeredity/100).toFixed(3)}) × ${actMod.toFixed(3)} = ${rFinalClamped.toFixed(1)}%`;

  /* slider row */
  const SliderRow = ({ label, value, min, max, step=1, onChange, suffix='', note }) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: C.textSec, fontWeight: '600' }}>{label}</span>
          <span style={{ fontSize: '13px', color: C.text, fontWeight: '700', fontFamily: 'monospace' }}>
            {typeof value === 'number' ? (Number.isInteger(step) ? Math.round(value) : value.toFixed(1)) : value}{suffix}
          </span>
        </div>
        <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: C.border, borderRadius: '2px' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: C.blue, borderRadius: '2px' }} />
          </div>
          <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: '20px', margin: 0 }}
          />
          <div style={{
            position: 'absolute', left: `calc(${pct}% - 7px)`,
            width: '14px', height: '14px', borderRadius: '50%',
            background: C.blue, border: `2px solid ${C.card}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)', pointerEvents: 'none',
          }} />
        </div>
        {note && <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.textMuted, marginTop: '4px', padding: '4px 8px', background: C.surface, borderRadius: '5px' }}>{note}</div>}
      </div>
    );
  };

  const DeltaBadge = ({ value, suffix = '%' }) => {
    const v = parseFloat(value);
    const color = v > 0 ? C.red : v < 0 ? C.green : C.textMuted;
    return (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color }}>
        {v > 0 ? '+' : ''}{typeof v === 'number' ? v.toFixed(1) : v}{suffix}
      </span>
    );
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* header */}
      <div style={{ fontSize: '11px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
        ⚡ Try It — Adjust inputs to see risk change live
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* ── ML Baseline ── */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            ML Baseline Risk <span style={{ fontSize: '11px', color: C.textMuted }}>(your model output)</span>
          </div>
          <SliderRow
            label="ML predicted risk" value={baseline} min={0} max={100}
            onChange={setBaseline} suffix="%"
            note="R_baseline = ML model output (High/Moderate/Low mapped to %) → input directly"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec }}>
            <span>baseline</span>
            <span style={{ fontFamily: 'monospace', color: C.blue }}>{baseline.toFixed(0)}%</span>
          </div>
        </div>

        {/* ── Blood Pressure ── */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            Blood Pressure Parameters
          </div>
          <SliderRow label="Systolic BP (mmHg)" value={sbp} min={70} max={220} onChange={setSbp}
            note="" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec, marginBottom: '10px' }}>
            <span>→ SBP impact</span><DeltaBadge value={drBP > 0 ? '+' + drBP.toFixed(1) : drBP.toFixed(1)} suffix="" />
          </div>
          <SliderRow label="Diastolic BP (mmHg)" value={dbp} min={40} max={140} onChange={setDbp} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec }}>
            <span>MAP = {map.toFixed(1)} mmHg</span>
            <DeltaBadge value={drBP} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.textMuted, marginTop: '6px', padding: '4px 8px', background: C.surface, borderRadius: '5px' }}>
            MAP = (SBP + 2×DBP) / 3 &nbsp;|&nbsp; ΔR_BP(%) = [(MAP − 93.3) / 93.3] × 35
          </div>
        </div>

        {/* ── Weight / BMI ── */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            Weight / BMI Parameters
          </div>
          <SliderRow label="Weight (kg)" value={weight} min={30} max={200} step={0.5} onChange={setWeight} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec, marginBottom: '10px' }}>
            <span>→ Weight impact</span><DeltaBadge value={drWeight} />
          </div>
          <SliderRow label="Height (cm)" value={height} min={100} max={220} onChange={setHeight} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec }}>
            <span>BMI = {bmi.toFixed(1)}</span>
            <DeltaBadge value={drWeight} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.textMuted, marginTop: '6px', padding: '4px 8px', background: C.surface, borderRadius: '5px' }}>
            BMI = weight(kg) / height(m)² &nbsp;|&nbsp; ΔR_Weight(%) = [(BMI − 25) / 25] × 40
          </div>
        </div>

        {/* ── Heredity ── */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
            Heredity / Family History
          </div>
          {/* quick toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {[
              { label: 'Father diabetic (+50%)', delta: 0.5 },
              { label: 'Mother diabetic (+50%)', delta: 0.5 },
              { label: 'Sibling diabetic (+30%)', delta: 0.3 },
              { label: 'Grandparent (+15%)', delta: 0.15 },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => setHScore(h => Math.min(1.0, parseFloat((h + item.delta).toFixed(2))))}
                style={{
                  padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textSec, fontSize: '10px', cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {item.label}
              </button>
            ))}
            <button type="button" onClick={() => setHScore(0)} style={{
              padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.redBg}`,
              background: C.redBg, color: C.red, fontSize: '10px', cursor: 'pointer', fontWeight: '600',
            }}>Reset</button>
          </div>
          <SliderRow label="H_score (computed)" value={hScore} min={0} max={1} step={0.01} onChange={setHScore}
            note="H_score = Σ(family weights), capped at 1.0 | ΔR_Heredity(%) = H_score × 25" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec }}>
            <span>H_score computed: {hScore.toFixed(2)}</span>
            <DeltaBadge value={drHeredity > 0 ? '+' + drHeredity.toFixed(1) : '0.0'} suffix="" />
          </div>
        </div>

      </div>

      {/* ── Physical Activity (full width) ── */}
      <div style={{ ...cardStyle, marginTop: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
          Physical Activity — MET-based
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: C.textSec, marginBottom: '6px', fontWeight: '600' }}>Activity type</div>
            <select
              value={metMin}
              onChange={e => setMetMin(parseFloat(e.target.value))}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, padding: '8px 12px', fontSize: '12px', width: '100%', cursor: 'pointer' }}
            >
              {[
                [280, 'Light walk (2 METs)'],
                [490, 'Brisk walk (3.5 METs)'],
                [630, 'Jogging (7 METs)'],
                [720, 'Running (8 METs)'],
                [900, 'Vigorous (10 METs)'],
              ].map(([v, l]) => <option key={v} value={v} style={{ background: C.surface }}>{l}</option>)}
            </select>
            <div style={{ marginTop: '8px', fontSize: '11px', color: C.textSec }}>
              MET-min/wk: <span style={{ fontFamily: 'monospace', color: C.text, fontWeight: '700' }}>{Math.round(metMin)}</span>
            </div>
          </div>
          <div>
            <SliderRow
              label="MET-min / week (drag to adjust)"
              value={metMin} min={0} max={2000} step={10} onChange={setMetMin}
              note="MET_weekly = METs × min/day × days/week | Modifier = 1 − [0.30 × (MET_w − 600) / 600] (clamp 0.5–1.2)"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.textSec }}>
              <span>Modifier</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: actMod <= 1.0 ? C.green : C.red }}>
                {actMod.toFixed(3)}×
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Composite Risk Output ── */}
      <div style={{ ...cardStyle, marginTop: '12px', background: riskBg, border: `1px solid ${riskColor}44` }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
          Composite Risk Output
        </div>

        {/* delta tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'BP delta', value: drBP, color: drBP > 0 ? C.red : C.green },
            { label: 'Weight delta', value: drWeight, color: drWeight > 0 ? C.amber : C.green },
            { label: 'Heredity delta', value: drHeredity, color: drHeredity > 0 ? C.purple : C.textMuted },
            { label: 'Activity modifier', value: null, display: `${actMod.toFixed(3)}×`, color: actMod <= 1 ? C.green : C.red },
          ].map((d, i) => (
            <div key={i} style={{ background: C.card, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: C.textSec, marginBottom: '4px' }}>{d.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: d.color, fontFamily: 'monospace' }}>
                {d.display ?? (d.value >= 0 && d.value !== 0 ? '+' : '') + d.value.toFixed(1) + '%'}
              </div>
            </div>
          ))}
        </div>

        {/* progress bar */}
        <div style={{ height: '10px', background: C.border, borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ width: `${rFinalClamped}%`, height: '100%', background: riskColor, borderRadius: '5px', transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: riskColor, fontFamily: 'monospace', lineHeight: 1 }}>
              {rFinalClamped.toFixed(1)}%
            </div>
            <div style={{ fontSize: '13px', color: riskColor, fontWeight: '700', marginTop: '2px' }}>
              {riskLabel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: C.textSec, marginBottom: '4px' }}>
              {rFinalClamped >= 65 ? 'Immediate physician review recommended' : rFinalClamped >= 33 ? 'Intervention recommended' : 'Continue healthy lifestyle'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '10px', color: C.textSec, padding: '6px 10px', background: C.surface, borderRadius: '6px' }}>
          {compositeFormula}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main WCRSDashboard
═══════════════════════════════════════════════════ */
export default function WCRSDashboard({ predictionResult, formData, user, onBack, onBookAppointment, isDark = false }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [showSliders, setShowSliders] = useState(true);

  const C = isDark ? themes.dark : themes.light;

  const wcrs = predictionResult?.wcrs || {};
  const score = wcrs.wcrs_score || 0;
  const baseline = wcrs.r_baseline || 0;
  const formulas = wcrs.formulas || {};
  const riskLabel = score >= 65 ? 'High Risk' : score >= 33 ? 'Moderate Risk' : 'Low Risk';
  const riskColor = score >= 65 ? C.red : score >= 33 ? C.amber : C.green;
  const riskBg    = score >= 65 ? C.redBg : score >= 33 ? C.amberBg : C.greenBg;

  const sbp = parseFloat(formData?.systolic_bp || 120);
  const dbp = parseFloat(formData?.diastolic_bp || 80);
  const map = ((sbp + 2 * dbp) / 3).toFixed(1);
  const bmiVal = parseFloat(wcrs.bmi || formData?.bmi || ((parseFloat(formData?.weight||70)) / Math.pow((parseFloat(formData?.height||170)/100),2)));
  const hScore = formulas.heredity?.h_score || 0;

  const gaugeOffset = Math.max(0, Math.min(207, 207 - (score / 100) * 207));

  /* impact items */
  const impactItems = [
    { label: 'ML Baseline', value: baseline, pct: baseline, color: C.blue, colorDk: C.blueDk },
    { label: 'BP (ΔR_BP)', value: formulas.bp?.delta_r_pct || 0, pct: Math.abs(formulas.bp?.delta_r_pct || 0), color: C.red, colorDk: C.redDk, sign: (formulas.bp?.delta_r_pct || 0) >= 0 ? '+' : '' },
    { label: 'Weight (ΔR_Wt)', value: formulas.weight?.delta_r_pct || 0, pct: Math.abs(formulas.weight?.delta_r_pct || 0), color: C.amber, colorDk: C.amberDk, sign: (formulas.weight?.delta_r_pct || 0) >= 0 ? '+' : '' },
    { label: 'Heredity (ΔR_Hr)', value: formulas.heredity?.delta_r_pct || 0, pct: Math.abs(formulas.heredity?.delta_r_pct || 0), color: C.purple, colorDk: C.purpleDk, sign: (formulas.heredity?.delta_r_pct || 0) >= 0 ? '+' : '' },
    { label: 'Activity modifier', value: ((1 - (formulas.activity?.modifier || 1)) * 100), pct: Math.abs((1 - (formulas.activity?.modifier || 1)) * 100), color: (formulas.activity?.modifier || 1) < 1 ? C.green : C.amber, colorDk: (formulas.activity?.modifier || 1) < 1 ? C.greenDk : C.amberDk, sign: (formulas.activity?.modifier || 1) < 1 ? '−' : '+' },
  ];
  const maxPct = Math.max(...impactItems.map(x => x.pct), 1);
  const totalPct = impactItems.reduce((s, i) => s + i.pct, 0);

  const mlHigh = predictionResult?.probabilities?.high ?? Math.max(0.01, Math.min(0.99, score / 100));
  const mlLow  = predictionResult?.probabilities?.low ?? Math.max(0.01, 1 - mlHigh);
  const mlMod  = Math.max(0, 1 - mlHigh - mlLow);

  /* dominant driver */
  const paramItems = impactItems.slice(1);
  const dominant = paramItems.reduce((a, b) => b.pct > a.pct ? b : a, paramItems[0]);

  /* chart */
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const trendWcrs = Array(7).fill(score);
    const trendBl   = Array(7).fill(baseline);
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Today'],
        datasets: [
          { label: 'WCRS Final', data: trendWcrs, borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 2, pointRadius: 3, pointBackgroundColor: C.red, tension: 0.35, fill: true },
          { label: 'ML Baseline', data: trendBl, borderColor: C.blue, borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false, borderDash: [4,3] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 9 }, color: C.textMuted }, grid: { display: false } },
          y: {
            min: Math.max(0, score - 15), max: Math.min(100, score + 15),
            ticks: { font: { size: 9 }, color: C.textMuted, callback: v => v + '%' },
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [score, baseline, isDark, C]); // Re-render chart explicitly when theme changes

  const recommendations = score >= 85
    ? { color: C.red, label: 'Very High Risk — >85%', items: ['Emergency clinical escalation','Weekly monitoring','Endocrinologist referral','SMS alert to emergency contact','Dashboard critical alert + call'] }
    : score >= 65
    ? { color: C.red, label: 'High Risk — 65%–85%', items: ['Immediate physician review','Monthly monitoring','HbA1c + FBG + lipid panel ordered','SMS + dashboard alert triggered','Video call with remote doctor'] }
    : score >= 33
    ? { color: C.amber, label: 'Moderate Risk — 33%–65%', items: ['Diet + activity intervention plan','3-monthly monitoring','FBG test ordered','SMS: Moderate risk — see doctor','Optional video consult offered'] }
    : { color: C.green, label: 'Low Risk — <33%', items: ['Lifestyle counselling only','Annual screening recommended','Maintain current activity level','No physician escalation needed'] };

  const card = getCardStyle(C);
  const CardTitle = ({ children }) => (
    <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>{children}</div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: '13px', color: C.text, transition: 'background-color 0.3s, color 0.3s' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .live-dot{width:6px;height:6px;border-radius:50%;background:${C.green};display:inline-block;animation:pulse 2s infinite;}
        input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:1px;opacity:0;}
      `}</style>

      <div style={{ maxWidth: '100%' }}>

        {/* ── Header ── */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800' }}>RHMS — Diabetic Risk Dashboard</div>
            <div style={{ fontSize: '11px', color: C.textSec, marginTop: '2px' }}>
              Patient: {formData?.fullName || user?.displayName || 'Patient'} &nbsp;·&nbsp;
              ID: {formData?.patientId || 'PT-' + Date.now().toString().slice(-6)} &nbsp;·&nbsp; Last sync: just now
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: C.greenBg, color: C.green, border: `1px solid ${C.green}44` }}>
              <span className="live-dot" /> Live
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: riskBg, color: riskColor, border: `1px solid ${riskColor}44` }}>
              {riskLabel}
            </span>
            <button onClick={onBack} style={{ padding: '5px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: C.textSec }}>
              ← New Test
            </button>
            <button onClick={onBookAppointment} style={{ padding: '5px 14px', background: C.red, border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: '#fff' }}>
              Book Doctor
            </button>
          </div>
        </div>

        {/* ── ROW 1: Gauge + Impact ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px', marginBottom: '12px' }}>

          {/* Gauge */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CardTitle>Composite Risk Score</CardTitle>
            <svg width="170" height="96" viewBox="0 0 170 96">
              <path d="M 19 84 A 66 66 0 0 1 151 84" fill="none" stroke={C.surface} strokeWidth="13" strokeLinecap="round" />
              <path d="M 19 84 A 66 66 0 0 1 151 84" fill="none" stroke={riskColor} strokeWidth="13" strokeLinecap="round"
                strokeDasharray="207" strokeDashoffset={gaugeOffset} />
              <text x="85" y="68" textAnchor="middle" fontSize="28" fontWeight="800" fill={riskColor} fontFamily="'Courier New',monospace">{score.toFixed(0)}%</text>
              <text x="85" y="84" textAnchor="middle" fontSize="8" fill={C.textMuted} fontFamily="'Segoe UI',sans-serif">WCRS Final Score</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
              <div style={{ background: C.surface, borderRadius: '8px', padding: '8px 10px', flex: 1, marginRight: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: C.textMuted }}>ML Baseline</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: C.blue, fontFamily: 'monospace' }}>{baseline}%</div>
              </div>
              <div style={{ background: C.surface, borderRadius: '8px', padding: '8px 10px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: C.textMuted }}>WCRS Final</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: riskColor, fontFamily: 'monospace' }}>{score}%</div>
              </div>
            </div>
          </div>

          {/* Impact bars */}
          <div style={card}>
            <CardTitle>Parameter Impact Breakdown</CardTitle>
            {impactItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', width: '120px', flexShrink: 0, color: C.textSec }}>{item.label}</span>
                <div style={{ flex: 1, height: '8px', background: C.surface, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(item.pct / maxPct) * 100}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '52px', textAlign: 'right', fontFamily: 'monospace', color: item.colorDk }}>
                  {i === 0 ? '' : item.sign}{item.value.toFixed(1)}%
                </span>
              </div>
            ))}
            <div style={{ height: '1px', background: C.border, margin: '10px 0' }} />
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              {impactItems.map((s, i) => <div key={i} style={{ width: `${totalPct > 0 ? (s.pct / totalPct) * 100 : 0}%`, background: s.color }} />)}
            </div>
            <div style={{ fontSize: '10px', color: C.textSec }}>
              <strong style={{ color: C.text }}>Dominant risk driver</strong><br />
              {dominant ? `ΔR_${dominant.label.replace(/[()ΔR_]/g,'').trim()} — highest impact parameter (${dominant.pct.toFixed(1)}% contribution)` : '—'}
            </div>
            <div style={{ marginTop: '8px', padding: '6px 10px', background: C.surface, borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: C.textSec }}>
              {wcrs.composite_formula || `R_final = ${baseline}% × (1 + modifiers) × ActivityMod = ${score}%`}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Sensor values + ML output + Heredity/Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>

          {/* Vital readings (manual) */}
          <div style={card}>
            <CardTitle>Recorded Vitals</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' }}>
              {[
                { label: 'SBP', val: sbp + ' mmHg', alert: sbp >= 140 },
                { label: 'DBP', val: dbp + ' mmHg', alert: dbp >= 90 },
                { label: 'MAP', val: map + ' mmHg', alert: parseFloat(map) >= 100 },
                { label: 'SpO₂', val: (formData?.spo2 || '--') + '%', alert: parseFloat(formData?.spo2 || 100) < 95 },
                { label: 'HR', val: (formData?.pulse_rate || '--') + ' bpm', alert: false },
                { label: 'Temp', val: (formData?.temperature || '--') + '°C', alert: false },
              ].map(({ label, val, alert }) => (
                <div key={label} style={{ background: alert ? C.redBg : C.surface, borderRadius: '7px', padding: '8px 10px', border: alert ? `1px solid ${C.red}44` : 'none' }}>
                  <div style={{ fontSize: '9px', color: C.textMuted, marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: alert ? C.red : C.text, fontFamily: 'monospace' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', padding: '6px 8px', background: parseFloat(map) >= 100 ? C.amberBg : C.greenBg, borderRadius: '6px', fontSize: '10px', color: parseFloat(map) >= 100 ? C.amber : C.green }}>
              MAP {map} mmHg {parseFloat(map) >= 100 ? `→ ΔR_BP = +${(formulas.bp?.delta_r_pct || 0).toFixed(1)}%` : '— within normal range'}
            </div>
          </div>

          {/* ML Model Output */}
          <div style={card}>
            <CardTitle>ML Model Output</CardTitle>
            {[
              { label: 'High risk', prob: mlHigh, color: C.red },
              { label: 'Moderate', prob: mlMod, color: C.amber },
              { label: 'Low risk', prob: mlLow, color: C.green },
            ].map(({ label, prob, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: C.textSec, width: '72px', flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: '8px', background: C.surface, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${prob * 100}%`, height: '100%', background: color, borderRadius: '4px' }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>{prob.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: C.border, margin: '10px 0' }} />
            <div style={{ fontSize: '10px', color: C.textSec, lineHeight: '1.8' }}>
              <strong style={{ color: C.text }}>Glucose</strong> {formData?.glucose || '--'} mg/dL &nbsp;·&nbsp;
              <strong style={{ color: C.text }}>BMI</strong> {bmiVal.toFixed(1)} &nbsp;·&nbsp;
              <strong style={{ color: C.text }}>Acetone</strong> {formData?.acetone || '--'} ppm &nbsp;·&nbsp;
              <strong style={{ color: C.text }}>BP</strong> {sbp}/{dbp}
            </div>
            <div style={{ marginTop: '8px', padding: '6px 8px', background: C.blueBg, borderRadius: '6px', fontSize: '10px', color: C.blue }}>
              Prediction: <strong>{riskLabel}</strong> ({(mlHigh * 100).toFixed(0)}% probability)
            </div>
          </div>

          {/* Heredity + Activity */}
          <div style={card}>
            <CardTitle>Heredity + Activity</CardTitle>
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.textSec, marginBottom: '6px' }}>H_score = {hScore.toFixed(2)} → ΔR_Heredity</div>
            <div style={{ height: '6px', background: C.surface, borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ width: `${hScore * 100}%`, height: '100%', background: C.purple }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textSec, marginBottom: '10px' }}>
              <span>Heredity impact</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: C.purple }}>+{(formulas.heredity?.delta_r_pct || 0).toFixed(1)}%</span>
            </div>
            <div style={{ height: '1px', background: C.border, margin: '8px 0' }} />
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.textSec, marginBottom: '6px' }}>Activity Tracker</div>
            {[
              { label: 'MET-min/week', val: formulas.activity?.met_weekly || '--' },
              { label: 'Threshold', val: '600 MET-min' },
              { label: 'Activity modifier', val: `${(formulas.activity?.modifier || 1).toFixed(3)}×`, bold: true, color: (formulas.activity?.modifier || 1) < 1 ? C.green : C.amber },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                <span style={{ color: C.textSec }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: r.bold ? '700' : '500', color: r.color || C.text }}>{r.val}</span>
              </div>
            ))}
            <div style={{ marginTop: '8px', padding: '5px 8px', background: (formulas.activity?.modifier || 1) <= 1.0 ? C.greenBg : C.amberBg, borderRadius: '6px', fontSize: '10px', color: (formulas.activity?.modifier || 1) <= 1.0 ? C.green : C.amber }}>
              {(formulas.activity?.modifier || 1) <= 1.0 ? 'Activity above WHO threshold — reducing risk' : 'Below 600 MET-min/wk — adding risk'}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Trend + Recommendations ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={card}>
            <CardTitle>Risk Trend — Last 7 Readings</CardTitle>
            <div style={{ height: '130px', position: 'relative' }}>
              <canvas ref={chartRef} />
            </div>
          </div>
          <div style={card}>
            <CardTitle>Clinical Recommendations</CardTitle>
            <div style={{ padding: '8px 12px', borderLeft: `2px solid ${recommendations.color}`, background: recommendations.color + '11', borderRadius: '0 6px 6px 0', marginBottom: '10px' }}>
              <strong style={{ color: recommendations.color, fontSize: '10px' }}>{recommendations.label}:</strong>
              <ul style={{ margin: '6px 0 0 14px', padding: 0, fontSize: '10px', color: C.textSec, lineHeight: '1.9' }}>
                {recommendations.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onBookAppointment} style={{ flex: 1, padding: '8px', background: C.red, border: 'none', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                Book Appointment
              </button>
              <button onClick={onBack} style={{ flex: 1, padding: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.textSec, fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* ── ROW 4: Formula breakdown ── */}
        <div style={{ ...card, marginBottom: '12px' }}>
          <CardTitle>WCRS Formula Breakdown — All Parameters</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[
              { title: 'Blood Pressure (MAP)', formula: formulas.bp?.formula, pct: formulas.bp?.delta_r_pct, color: C.red, note: `SBP ${sbp} / DBP ${dbp} → MAP ${map} mmHg` },
              { title: 'Weight / BMI', formula: formulas.weight?.formula, pct: formulas.weight?.delta_r_pct, color: C.amber, note: `BMI ${bmiVal.toFixed(1)}` },
              { title: 'Heredity', formula: formulas.heredity?.formula, pct: formulas.heredity?.delta_r_pct, color: C.purple, note: `H_score = ${hScore.toFixed(2)}` },
              { title: 'Activity Modifier', formula: formulas.activity?.formula, pct: null, color: C.green, note: `${formulas.activity?.met_weekly || 0} MET-min/wk → ${(formulas.activity?.modifier || 1).toFixed(3)}×` },
            ].map(({ title, formula, pct, color, note }) => (
              <div key={title} style={{ background: C.surface, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color, marginBottom: '6px' }}>{title}</div>
                {pct != null && <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color, marginBottom: '4px' }}>{pct >= 0 ? '+' : ''}{pct?.toFixed(1)}%</div>}
                <div style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'monospace', lineHeight: '1.6', wordBreak: 'break-all' }}>{formula || '—'}</div>
                <div style={{ fontSize: '9px', color: C.textSec, marginTop: '4px' }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', padding: '7px 10px', background: C.surface, borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', color: C.textSec }}>
            <strong style={{ color: C.text }}>Final:</strong> {wcrs.composite_formula || `R_final = ${baseline}% × (1 + modifiers) × ActivityMod = ${score}%`}
          </div>
        </div>

        {/* ── ROW 5: Interactive Sliders ── */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: C.text }}>
              🎛️ Interactive Risk Explorer
              <span style={{ fontSize: '11px', fontWeight: '400', color: C.textSec, marginLeft: '8px' }}>
                Drag sliders to explore how parameters affect composite risk
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSliders(p => !p)}
              style={{ padding: '5px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: C.textSec }}
            >
              {showSliders ? 'Collapse ↑' : 'Expand ↓'}
            </button>
          </div>
          {showSliders && (
            <SliderPanel predictionResult={predictionResult} formData={formData} C={C} />
          )}
        </div>

      </div>
    </div>
  );
}
