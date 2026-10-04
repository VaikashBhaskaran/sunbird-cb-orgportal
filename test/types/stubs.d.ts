/**
 * Ambient declarations for packages that source files import but that are not
 * installed in this repository. `moduleNameMapper` in jest.config.js redirects these
 * to test/mocks/emptyStub.js at runtime; these declarations stop ts-jest failing the
 * same imports at compile time with TS2307.
 *
 * This file is deliberately outside `src/`, and is referenced only from
 * tsconfig.spec.json, so the application build still reports these imports as errors
 * rather than silently accepting them.
 */
declare module '@ws-widget/collection'
declare module '@ws-widget/collection/*'
declare module '@ws-widget/utils'
declare module '@ws-widget/utils/*'
declare module '@ws-widget/resolver'
declare module '@ws-widget/resolver/*'
declare module '@ws/author'
declare module '@ws/author/*'
