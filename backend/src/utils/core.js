const crypto = require('node:crypto');
const slug = s => String(s || '').toLowerCase().replace(/[đĐ]/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'san-pham';
const httpError = (status, message) => Object.assign(new Error(message), {status});
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const clean = s => String(s ?? '').trim().slice(0,500);
const isId = id => /^[0-9a-f]{24}$/i.test(String(id));
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));
const num = (value, fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const money = n => Math.max(0, Math.round(num(n)));
const shippingCost = (method, subtotal) => method === 'express' ? 39000 : (subtotal >= 500000 ? 0 : 25000);
function priceSummary(lines, method='standard', discount=0) {
  const subtotal = lines.reduce((sum, i) => sum + money(i.price) * Math.max(0, Math.trunc(num(i.quantity))), 0);
  const shipping = shippingCost(method, subtotal);
  const appliedDiscount = Math.min(subtotal, money(discount));
  return {subtotal, shipping, discount:appliedDiscount, total:Math.max(0, subtotal + shipping - appliedDiscount)};
}
const tokenHash = value => crypto.createHash('sha256').update(value).digest('hex');
module.exports = {slug,httpError,asyncRoute,clean,isId,validEmail,num,money,shippingCost,priceSummary,tokenHash};
