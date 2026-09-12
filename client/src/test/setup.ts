import "@testing-library/jest-dom/vitest";
// jsdom does not implement the native dialog methods; browser tests cover focus and Escape.
if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
if (!HTMLDialogElement.prototype.close) HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
