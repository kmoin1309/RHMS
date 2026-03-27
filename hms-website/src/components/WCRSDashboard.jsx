import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/**
 * WCRSDashboard — Clinical-grade risk breakdown dashboard
 * Mirrors wcrs_clinical_dashboard.html and powered by live backend data.
 */
export default function WCRSDashboard({ predictionResult, formData, realData, user, onBack, onBookAppointment }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const wcrs = predictionResult?.wcrs || {};
  const score = wcrs.wcrs_score || 0;
  const baseline = wcrs.r_baseline || 0;
  const impacts = wcrs.parameter_impacts || [];
  const formulas = wcrs.formulas || {};
  const prediction = predictionResult?.prediction;
  const riskLevel = predictionResult?.riskLevel || 'low';

  // Color palette matching reference
  const C = {
    red: '#E24B4A', redDark: '#A32D2D', redBg: '#FCEBEB', redText: '#791F1F',
    amber: '#EF9F27', amberText: '#633806', amberBg: '#FAEEDA',
    green: '#1D9E75', greenText: '#085041', greenBg: '#E1F5EE',
    blue: '#378ADD', blueDark: '#185FA5', blueBg: '#E6F1FB', blueText: '#0C447C',
    purple: '#534AB7', purpleText: '#3C3489', purpleBg: '#EEEDFE',
    surface: '#F1EFE8', card: '#FFFFFF', page: '#F5F5F2',
    textPrimary: '#1a1a18', textSec: '#5F5E5A', textTert: '#888780',
    border: 'rgba(0,0,0,0.09)',
  };

  // Gauge arc: out of 207px arc
  const gaugeOffset = Math.max(0, Math.min(207, 207 - (score / 100) * 207));
  const gaugeColor = score >= 60 ? C.red : score >= 35 ? C.amber : C.green;

  // Risk label
  const riskLabel = score >= 60 ? 'High Risk' : score >= 35 ? 'Moderate Risk' : 'Low Risk';
  const riskBadgeBg = score >= 60 ? C.redBg : score >= 35 ? C.amberBg : C.greenBg;
  const riskBadgeColor = score >= 60 ? C.redText : score >= 35 ? C.amberText : C.greenText;

  // Sensor data from realData or formData fallback
  const sbp = parseFloat(realData?.systolic || formData?.systolic_bp || 0);
  const dbp = parseFloat(realData?.diastolic || formData?.diastolic_bp || 0);
  const map = ((sbp + 2 * dbp) / 3).toFixed(1);
  const hr = parseFloat(realData?.heartRate || 0);
  const spo2 = parseFloat(realData?.spo2 || 0);
  const temp = parseFloat(realData?.temperature || 0);
  const acetone = parseFloat(realData?.acetone || formData?.acetone || 0);
  const bmiVal = parseFloat(predictionResult?.bmi || formData?.bmi || 0);

  // Sensor card status
  const getSensorClass = (key, val) => {
    if (key === 'sbp' && val >= 140) return 'alert';
    if (key === 'sbp' && val >= 130) return 'warn';
    if (key === 'dbp' && val >= 90) return 'alert';
    if (key === 'dbp' && val >= 80) return 'warn';
    if (key === 'map' && val >= 100) return 'warn';
    if (key === 'spo2' && val < 95) return 'alert';
    if (key === 'hr' && (val > 100 || val < 60)) return 'warn';
    if (key === 'temp' && val >= 37.2) return 'warn';
    return '';
  };

  // Impact bar data
  const impactItems = [
    { label: 'ML Baseline', value: baseline, pct: baseline, color: C.blue, colorDark: C.blueDark, sign: '' },
    {
      label: 'Blood Pressure',
      value: formulas.bp?.delta_r_pct || 0,
      pct: Math.abs(formulas.bp?.delta_r_pct || 0),
      color: (formulas.bp?.delta_r_pct || 0) > 0 ? C.red : C.green,
      colorDark: (formulas.bp?.delta_r_pct || 0) > 0 ? C.redDark : C.greenText,
      sign: (formulas.bp?.delta_r_pct || 0) > 0 ? '+' : '',
    },
    {
      label: 'Weight / BMI',
      value: formulas.weight?.delta_r_pct || 0,
      pct: Math.abs(formulas.weight?.delta_r_pct || 0),
      color: (formulas.weight?.delta_r_pct || 0) > 0 ? C.amber : C.green,
      colorDark: (formulas.weight?.delta_r_pct || 0) > 0 ? C.amberText : C.greenText,
      sign: (formulas.weight?.delta_r_pct || 0) > 0 ? '+' : '',
    },
    {
      label: 'Heredity',
      value: formulas.heredity?.delta_r_pct || 0,
      pct: Math.abs(formulas.heredity?.delta_r_pct || 0),
      color: C.purple, colorDark: C.purpleText,
      sign: (formulas.heredity?.delta_r_pct || 0) > 0 ? '+' : '',
    },
    {
      label: 'Activity mod.',
      value: ((1 - (formulas.activity?.modifier || 1)) * 100),
      pct: Math.abs((1 - (formulas.activity?.modifier || 1)) * 100),
      color: (formulas.activity?.modifier || 1) < 1 ? C.green : C.amber,
      colorDark: (formulas.activity?.modifier || 1) < 1 ? C.greenText : C.amberText,
      sign: (formulas.activity?.modifier || 1) < 1 ? '−' : '+',
    },
  ];

  // Stacked bar proportions
  const totalImpact = impactItems.reduce((s, i) => s + i.pct, 0);
  const stackedItems = totalImpact > 0 ? impactItems.map(i => ({ ...i, stackPct: (i.pct / totalImpact) * 100 })) : [];

  // ML output probabilities — derive from backend if available
  const rawHigh = predictionResult?.probabilities?.high;
  const rawLow = predictionResult?.probabilities?.low;
  const mlHighProb = rawHigh !== undefined ? rawHigh : Math.max(0.01, Math.min(0.99, score / 100));
  const mlLowProb = rawLow !== undefined ? rawLow : Math.max(0.01, Math.round((1 - mlHighProb) * 100) / 100);
  const mlModProb = Math.max(0, 1 - mlHighProb - mlLowProb);

  // Trend data: Use actual single point flatline since we don't have historical data hooked up
  const trendWcrs = Array(7).fill(score);
  const trendBaseline = Array(7).fill(baseline);

  // Build chart
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) { chartInstance.current.destroy(); }
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
        datasets: [
          {
            label: 'WCRS Final',
            data: trendWcrs,
            borderColor: C.red,
            backgroundColor: 'rgba(226,75,74,0.07)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: C.red,
            tension: 0.35,
            fill: true,
          },
          {
            label: 'ML Baseline',
            data: trendBaseline,
            borderColor: C.blue,
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 9 }, color: C.textTert }, grid: { display: false } },
          y: {
            min: Math.max(0, Math.min(...trendWcrs) - 15),
            max: Math.min(100, Math.max(...trendWcrs) + 15),
            ticks: { font: { size: 9 }, color: C.textTert, callback: v => v + '%' },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [score, baseline]);

  // Clinical Recommendations based on Layer 4 action mapping
  const recommendations = [];
  if (score < 33) {
    recommendations.push({
      color: C.green, bg: C.greenBg, label: 'Low risk — R_final < 33%',
      text: '• Lifestyle counselling only<br/>• Annual screening recommended<br/>• Maintain current activity level<br/>• SMS: "Your risk is low. Keep it up."<br/>• No physician escalation needed',
    });
  } else if (score < 65) {
    recommendations.push({
      color: C.amber, bg: C.amberBg, label: 'Moderate risk — 33% to 65%',
      text: '• Diet + activity intervention plan<br/>• 3-monthly monitoring frequency<br/>• FBG test ordered<br/>• SMS: "Moderate risk detected. See doctor."<br/>• Optional video consult offered',
    });
  } else if (score <= 85) {
    recommendations.push({
      color: C.red, bg: C.redBg, label: 'High risk — 65% to 85%',
      text: '• Immediate physician review<br/>• Monthly monitoring frequency<br/>• HbA1c + FBG + lipid panel ordered<br/>• SMS + dashboard alert triggered<br/>• Video call with remote doctor initiated',
    });
  } else {
    recommendations.push({
      color: C.redDark, bg: C.redBg, label: 'Very high risk — > 85%',
      text: '• Emergency clinical escalation<br/>• Weekly monitoring frequency<br/>• Endocrinologist referral<br/>• SMS alert to emergency contact<br/>• Dashboard critical alert + call',
    });
  }

  // Heredity detail
  const hDetail = formulas.heredity?.detail || {};
  const hScore = formulas.heredity?.h_score || 0;
  const heredityRows = [
    { label: 'Father — T2D', val: hDetail.father || 0, active: !!hDetail.father },
    { label: 'Mother — T2D', val: hDetail.mother || 0, active: !!hDetail.mother },
    { label: 'Sibling — T2D', val: hDetail.sibling || 0, active: !!hDetail.sibling },
    { label: 'Grandparent — T2D', val: hDetail.grandparent || 0, active: !!hDetail.grandparent },
    { label: 'Family Diabetes Flag', val: hDetail.family_diabetes_flag || 0, active: !!hDetail.family_diabetes_flag },
  ].filter(r => r.active || r.label.includes('Father') || r.label.includes('Mother'));

  // Card & section styles
  const card = {
    background: C.card, border: `0.5px solid ${C.border}`,
    borderRadius: '10px', padding: '12px 14px',
  };
  const cardTitle = {
    fontSize: '10px', fontWeight: '700', color: C.textTert,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px',
  };
  const scard = (status) => ({
    background: status === 'alert' ? C.redBg : status === 'warn' ? C.amberBg : C.surface,
    borderRadius: '7px', padding: '8px 10px',
  });
  const svColor = (status) => status === 'alert' ? C.redDark : status === 'warn' ? C.amberText : C.textPrimary;

  return (
    <div style={{ background: C.page, minHeight: '100vh', padding: '24px 32px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: '13px', color: C.textPrimary }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .live-dot { width:6px;height:6px;border-radius:50%;background:#1D9E75;display:inline-block;animation:pulse 2s infinite; }
        .impact-track { flex:1;height:8px;background:${C.surface};border-radius:4px;overflow:hidden; }
        .ml-track { flex:1;height:10px;background:${C.surface};border-radius:5px;overflow:hidden; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '12px 16px', ...card }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>RHMS — Diabetic Risk Dashboard</div>
            <div style={{ fontSize: '11px', color: C.textSec, marginTop: '2px' }}>
              Patient: {formData?.fullName || user?.fullName || user?.name || user?.displayName || 'Patient'}&nbsp;·&nbsp;
              ID: {formData?.patientId || 'PT-' + Date.now().toString().slice(-6)}&nbsp;·&nbsp;
              Last sync: just now
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: C.greenBg, color: C.greenText }}>
              <span className="live-dot" /> Live
            </span>
            <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: riskBadgeBg, color: riskBadgeColor }}>
              {riskLabel}
            </span>
            <button onClick={onBack} style={{ marginLeft: '8px', padding: '4px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: C.textSec }}>
              ← New Test
            </button>
            {predictionResult?.prediction === 1 && (
              <button onClick={onBookAppointment} style={{ padding: '4px 12px', background: C.red, border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: '#fff' }}>
                Book Doctor
              </button>
            )}
          </div>
        </div>

        {/* ── ROW 1: Gauge + Parameter Impact ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '12px', marginBottom: '12px' }}>

          {/* Composite Risk Score (Gauge) */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
            <div style={cardTitle}>Composite risk score</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0 8px' }}>
              <svg width="170" height="96" viewBox="0 0 170 96">
                <path d="M 19 84 A 66 66 0 0 1 151 84" fill="none" stroke={C.surface} strokeWidth="13" strokeLinecap="round" />
                <path d="M 19 84 A 66 66 0 0 1 151 84" fill="none" stroke={gaugeColor} strokeWidth="13" strokeLinecap="round"
                  strokeDasharray="207" strokeDashoffset={gaugeOffset} />
                <text x="85" y="70" textAnchor="middle" fontSize="30" fontWeight="700" fill={score >= 60 ? C.redDark : score >= 35 ? C.amberText : C.greenText} fontFamily="'Courier New',monospace">
                  {score}%
                </text>
                <text x="85" y="85" textAnchor="middle" fontSize="9" fill={C.textTert} fontFamily="'Segoe UI',sans-serif">
                  WCRS Final Score
                </text>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '170px', marginTop: '-2px' }}>
                <span style={{ fontSize: '9px', color: C.textTert }}>Low</span>
                <span style={{ fontSize: '9px', color: C.textTert }}>Moderate</span>
                <span style={{ fontSize: '9px', color: C.textTert }}>High</span>
              </div>
            </div>
            <div style={{ height: '0.5px', background: C.border, margin: '10px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              <div style={{ background: C.surface, borderRadius: '7px', padding: '9px 11px' }}>
                <div style={{ fontSize: '10px', color: C.textTert, marginBottom: '2px' }}>ML Baseline</div>
                <div style={{ fontSize: '17px', fontWeight: '700', fontFamily: "'Courier New',monospace", color: C.blueDark }}>{baseline}%</div>
                <div style={{ fontSize: '9px', color: C.textTert, marginTop: '1px' }}>Model output</div>
              </div>
              <div style={{ background: C.surface, borderRadius: '7px', padding: '9px 11px' }}>
                <div style={{ fontSize: '10px', color: C.textTert, marginBottom: '2px' }}>WCRS adjusted</div>
                <div style={{ fontSize: '17px', fontWeight: '700', fontFamily: "'Courier New',monospace", color: score >= 60 ? C.redDark : C.greenText }}>{score}%</div>
                <div style={{ fontSize: '9px', color: C.textTert, marginTop: '1px' }}>After modifiers</div>
              </div>
            </div>
          </div>

          {/* Parameter Impact Breakdown */}
          <div style={card}>
            <div style={cardTitle}>Parameter impact breakdown</div>
            <div style={{ marginBottom: '12px' }}>
              {impactItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ fontSize: '11px', width: '90px', flexShrink: 0, color: C.textSec }}>{item.label}</span>
                  <div className="impact-track">
                    <div style={{ width: `${Math.min(100, (item.pct / Math.max(...impactItems.map(x => x.pct))) * 100)}%`, height: '100%', borderRadius: '4px', background: item.color }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '52px', textAlign: 'right', fontFamily: "'Courier New',monospace", color: item.colorDark }}>
                    {i === 0 ? '' : item.sign}{typeof item.value === 'number' ? item.value.toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: '0.5px', background: C.border, margin: '10px 0' }} />
            <div style={{ fontSize: '10px', color: C.textSec, marginBottom: '6px', fontWeight: '700' }}>Proportional contribution</div>
            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
              {stackedItems.map((s, i) => <div key={i} style={{ width: `${s.stackPct}%`, background: s.color }} />)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '9px', color: C.textSec, marginBottom: '8px' }}>
              {impactItems.map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                  {item.label} {stackedItems[i] ? Math.round(stackedItems[i].stackPct) : 0}%
                </span>
              ))}
            </div>
            <div style={{ background: C.surface, borderRadius: '6px', padding: '8px 10px', fontFamily: "'Courier New',monospace", fontSize: '10px', color: C.textSec, lineHeight: '1.7', marginTop: '8px' }}>
              {wcrs.composite_formula || `R_final = ${baseline}% × (1 + modifiers) × ActivityMod = ${score}%`}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Sensor Readings + ML Output + Heredity/Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>

          {/* Live Sensor Readings */}
          <div style={card}>
            <div style={cardTitle}>Live Sensor Readings (ESP32)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
              {[
                { label: 'SBP', val: sbp, unit: 'mmHg ↑', key: 'sbp' },
                { label: 'DBP', val: dbp, unit: 'mmHg', key: 'dbp' },
                { label: 'MAP', val: map, unit: 'mmHg', key: 'map' },
                { label: 'SpO2', val: spo2, unit: '%', key: 'spo2' },
                { label: 'HR', val: hr, unit: 'bpm', key: 'hr' },
                { label: 'Temp', val: temp.toFixed(1), unit: '°C', key: 'temp' },
              ].map(({ label, val, unit, key }) => {
                const st = getSensorClass(key, parseFloat(val));
                return (
                  <div key={key} style={scard(st)}>
                    <div style={{ fontSize: '9px', color: C.textTert, marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '17px', fontWeight: '700', fontFamily: "'Courier New',monospace", color: svColor(st) }}>{val}</div>
                    <div style={{ fontSize: '9px', color: C.textTert }}>{unit}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '8px', padding: '6px 8px', background: map >= 100 ? C.amberBg : C.greenBg, borderRadius: '6px', fontSize: '10px', color: map >= 100 ? C.amberText : C.greenText }}>
              MAP {map} mmHg {map >= 100 ? `> Normal 93.3 — ΔR_BP = +${(formulas.bp?.delta_r_pct || 0).toFixed(1)}%` : '— within normal range'}
            </div>
            {acetone > 0 && (
              <div style={{ marginTop: '6px', padding: '6px 8px', background: acetone > 0.5 ? C.amberBg : C.greenBg, borderRadius: '6px', fontSize: '10px', color: acetone > 0.5 ? C.amberText : C.greenText }}>
                Acetone {acetone} ppm{acetone > 0.5 ? ' — elevated, key ML feature' : ' — within normal range'}
              </div>
            )}
          </div>

          {/* ML Model Output */}
          <div style={card}>
            <div style={cardTitle}>ML Model Output</div>
            <div style={{ marginBottom: '6px' }}>
              {[
                { label: 'High risk', prob: mlHighProb, color: C.red, colorDark: C.redDark },
                { label: 'Moderate', prob: mlModProb, color: C.amber, colorDark: C.amberText },
                { label: 'Low risk', prob: mlLowProb, color: C.green, colorDark: C.greenText },
              ].map(({ label, prob, color, colorDark }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ fontSize: '11px', color: C.textSec, width: '78px', flexShrink: 0 }}>{label}</span>
                  <div className="ml-track">
                    <div style={{ width: `${prob * 100}%`, height: '100%', borderRadius: '5px', background: color }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '36px', textAlign: 'right', fontFamily: "'Courier New',monospace", color: colorDark }}>
                    {prob.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: '0.5px', background: C.border, margin: '10px 0' }} />
            <div style={{ fontSize: '10px', color: C.textSec, marginBottom: '5px', fontWeight: '600' }}>Top model features</div>
            <div style={{ fontSize: '10px', color: C.textSec, lineHeight: '1.9' }}>
              <span style={{ fontWeight: '600', color: C.textPrimary }}>Glucose</span> {formData?.glucose || 0} mg/dL &nbsp;·&nbsp;
              <span style={{ fontWeight: '600', color: C.textPrimary }}>BMI</span> {predictionResult?.bmi || 0} &nbsp;·&nbsp;
              <span style={{ fontWeight: '600', color: C.textPrimary }}>Acetone</span> {acetone} ppm &nbsp;·&nbsp;
              <span style={{ fontWeight: '600', color: C.textPrimary }}>BP</span> {sbp}/{dbp}
            </div>
            <div style={{ marginTop: '8px', padding: '6px 8px', background: C.blueBg, borderRadius: '6px', fontSize: '10px', color: C.blueText }}>
              Prediction: <strong>{riskLabel}</strong> ({(mlHighProb * 100).toFixed(0)}% probability) — {Object.keys(formData || {}).length} features
            </div>
            {/* Risk factors */}
            {predictionResult?.riskFactors?.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: C.textSec, marginBottom: '4px' }}>Flagged risk factors</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {predictionResult.riskFactors.map((f, i) => (
                    <span key={i} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: C.redBg, color: C.redText, fontWeight: '600' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Heredity + Activity */}
          <div style={card}>
            <div style={cardTitle}>Heredity + Activity</div>
            <div style={{ fontSize: '10px', color: C.textSec, marginBottom: '5px', fontWeight: '600' }}>Family history (H_score)</div>
            <div style={{ marginBottom: '8px' }}>
              {heredityRows.length === 0 ? (
                <div style={{ fontSize: '10px', color: C.textTert, padding: '6px 0' }}>No hereditary risk factors reported.</div>
              ) : heredityRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 7px', borderRadius: '5px', marginBottom: '4px', background: r.active ? C.purpleBg : C.surface }}>
                  <span style={{ fontSize: '10px', color: r.active ? C.purpleText : C.textSec }}>{r.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: r.active ? C.purpleText : C.textTert, fontFamily: "'Courier New',monospace" }}>
                    {r.active ? `+${r.val.toFixed(2)}` : '0.00'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '10px', padding: '0 2px' }}>
              <span style={{ color: C.textSec }}>H_score = {hScore.toFixed(2)} → ΔR_Heredity</span>
              <span style={{ fontWeight: '700', color: C.purpleText, fontFamily: "'Courier New',monospace" }}>+{(formulas.heredity?.delta_r_pct || 0).toFixed(1)}%</span>
            </div>
            <div style={{ height: '0.5px', background: C.border, margin: '10px 0' }} />
            <div style={{ fontSize: '10px', color: C.textSec, marginBottom: '5px', fontWeight: '600' }}>Activity tracker</div>
            {[
              { label: 'MET-min/week', val: formulas.activity?.met_weekly || 0, mono: true },
              { label: 'Threshold', val: `${formulas.activity?.met_threshold || 600} MET-min`, mono: false },
              { label: 'Activity modifier', val: `${(formulas.activity?.modifier || 1).toFixed(3)}×`, mono: true, bold: true, color: (formulas.activity?.modifier || 1) < 1 ? C.greenText : C.amberText },
            ].map(({ label, val, mono, bold, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', lineHeight: '1.9' }}>
                <span style={{ color: C.textSec }}>{label}</span>
                <span style={{ fontWeight: bold ? '700' : '500', fontFamily: mono ? "'Courier New',monospace" : 'inherit', color: color || C.textPrimary }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: '7px', padding: '5px 8px', background: (formulas.activity?.modifier || 1) <= 1.0 ? C.greenBg : C.amberBg, borderRadius: '6px', fontSize: '10px', color: (formulas.activity?.modifier || 1) <= 1.0 ? C.greenText : C.amberText }}>
              {(formulas.activity?.modifier || 1) <= 1.0
                ? `Activity above WHO threshold — reduces composite risk by ${((1 - (formulas.activity?.modifier || 1)) * 100).toFixed(1)}%`
                : 'Activity below WHO 600 MET-min/week — currently adding risk'}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Trend Chart + Clinical Recommendations ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '12px', marginBottom: '12px' }}>

          {/* Risk Trend Chart */}
          <div style={card}>
            <div style={cardTitle}>Risk Trend — Last 7 Readings</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '9px', color: C.textSec }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '16px', height: '2px', background: C.red, display: 'inline-block', borderRadius: '1px' }} />WCRS Final
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '16px', height: '1px', borderTop: `1px dashed ${C.blue}`, display: 'inline-block' }} />ML Baseline
              </span>
            </div>
            <div style={{ position: 'relative', height: '130px' }}>
              <canvas ref={chartRef} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: C.textSec }}>
              Current WCRS: <strong style={{ color: gaugeColor }}>{score}%</strong> &nbsp;·&nbsp;
              Trend: <strong style={{ color: trendWcrs[0] > score ? C.green : C.red }}>
                {trendWcrs[0] > score ? '↓ Improving' : trendWcrs[0] < score ? '↑ Worsening' : '→ Stable'}
              </strong>
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div style={card}>
            <div style={cardTitle}>Clinical Recommendations</div>
            {recommendations.map((r, i) => (
              <div key={i} style={{
                padding: '7px 9px', borderRadius: '0 6px 6px 0',
                borderLeft: `2px solid ${r.color}`,
                background: r.bg, color: r.color === C.green ? C.greenText : r.color === C.red ? C.redText : C.amberText,
                fontSize: '10px', lineHeight: '1.5', marginBottom: '7px',
              }}>
                <strong>{r.label}:</strong> <div style={{marginTop: '4px'}} dangerouslySetInnerHTML={{ __html: r.text }} />
              </div>
            ))}
            {/* Action buttons */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={onBookAppointment} style={{ flex: 1, padding: '8px', background: C.red, border: 'none', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                Book Appointment
              </button>
              <button onClick={onBack} style={{ flex: 1, padding: '8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '7px', color: C.textSec, fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* ── ROW 4: WCRS Formula Breakdown ── */}
        <div style={{ ...card, marginBottom: '12px' }}>
          <div style={cardTitle}>WCRS Formula Breakdown — All Parameters</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[
              { title: 'Blood Pressure (MAP)', formula: formulas.bp?.formula, pct: formulas.bp?.delta_r_pct, color: C.red, note: `SBP ${sbp} / DBP ${dbp} → MAP ${map} mmHg` },
              { title: 'Weight / BMI', formula: formulas.weight?.formula, pct: formulas.weight?.delta_r_pct, color: C.amber, note: `BMI ${bmiVal} (Normal: 25)` },
              { title: 'Heredity', formula: formulas.heredity?.formula, pct: formulas.heredity?.delta_r_pct, color: C.purple, note: `H_score = ${hScore.toFixed(2)}` },
              { title: 'Activity Modifier', formula: formulas.activity?.formula, pct: null, color: C.green, note: `${formulas.activity?.met_weekly || 0} MET-min/wk → modifier ${(formulas.activity?.modifier || 1).toFixed(3)}×` },
            ].map(({ title, formula, pct, color, note }) => (
              <div key={title} style={{ background: C.surface, borderRadius: '7px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color, marginBottom: '6px' }}>{title}</div>
                {pct !== null && <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: "'Courier New',monospace", color, marginBottom: '4px' }}>
                  {typeof pct === 'number' ? (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%' : '—'}
                </div>}
                <div style={{ fontSize: '9px', color: C.textTert, fontFamily: "'Courier New',monospace", lineHeight: '1.6', wordBreak: 'break-all' }}>{formula || '—'}</div>
                <div style={{ fontSize: '9px', color: C.textSec, marginTop: '4px' }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', background: C.surface, borderRadius: '6px', padding: '8px 10px', fontFamily: "'Courier New',monospace", fontSize: '10px', color: C.textSec, lineHeight: '1.7' }}>
            <strong style={{ color: C.textPrimary }}>Final:</strong> {wcrs.composite_formula || `R_final = ${baseline}% × (1 + modifiers) × ActivityMod = ${score}%`}
          </div>
        </div>

      </div>
    </div>
  );
}
