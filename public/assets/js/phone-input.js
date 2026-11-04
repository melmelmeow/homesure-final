/* ═══════════════════════════════════════════════════════════════════════════
   SHARED PHONE NUMBER INPUT LOGIC
   Same rule as the signup page's phone field, applied everywhere: the part
   after the fixed prefix (+63 or 0) is digits-only, max 10 digits, and the
   first digit must be 9 (every PH mobile number is 0+9XXXXXXXXX / +63 9XXXXXXXXX).
   ═══════════════════════════════════════════════════════════════════════════ */

const HSPhone = {
  attach(el) {
    el.addEventListener('input', () => {
      let digits = el.value.replace(/\D/g, '');
      while (digits.length && digits[0] !== '9') digits = digits.slice(1);
      el.value = digits.slice(0, 10);
    });
  },

  // Strips a stored "+639XXXXXXXXX" / "09XXXXXXXXX" value down to the bare
  // 10 local digits, for prefilling a .hs-phone-input field.
  strip(value) {
    if (!value) return '';
    let digits = String(value).replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('63')) digits = digits.slice(2);
    else if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
    while (digits.length && digits[0] !== '9') digits = digits.slice(1);
    return digits.slice(0, 10);
  },

  // Joins the fixed prefix with the field's local digits, for saving.
  full(prefix, localDigits) {
    const digits = String(localDigits || '').replace(/\D/g, '').slice(0, 10);
    return digits ? prefix + digits : '';
  },
};
window.HSPhone = HSPhone;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hs-phone-input input').forEach(el => HSPhone.attach(el));
});
