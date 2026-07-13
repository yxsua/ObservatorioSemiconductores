export function detailsToFieldErrors(details) {
  if (!Array.isArray(details)) {
    return {};
  }

  return details.reduce((errors, item) => {
    if (item?.field) {
      errors[item.field] = item.message;
    }

    return errors;
  }, {});
}
