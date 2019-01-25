const syssec_criteria = {
    'null-sec': 'Null Sec',
    'low-sec': 'Low Sec',
    'high-sec': 'High Sec',
}

for (var i = 1.0; i <= -1.0; i = i - 0.1) {
    const sec = Math.round(i * 10) / 10;
    syssec_rules[sec] = sec;
}

const system_security = {
    text: 'System Security',
    value: 'system-security',
    criteria: syssec_criteria
};
