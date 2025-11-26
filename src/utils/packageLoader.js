/**
 * Safe package loader for optional dependencies
 * Returns null if package is not available (e.g., on Linux deployment)
 */

export async function loadOptionalPackage(packageName) {
  try {
    const module = await import(packageName);
    return module.default || module;
  } catch (error) {
    console.warn(`⚠️ Optional package '${packageName}' not available:`, error.message);
    return null;
  }
}

export function throwPackageNotAvailable(packageName, alternative = 'system commands') {
  throw new Error(
    `Package '${packageName}' is not available. ` +
    `Please use ${alternative} instead or install the package locally.`
  );
}
