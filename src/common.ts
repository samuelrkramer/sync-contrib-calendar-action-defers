import PACKAGE from "../package.json";

export const PACKAGE_IDENTIFIER = `${PACKAGE.name}/${PACKAGE.NAME}`;
export const USER_AGENT = `${PACKAGE_IDENTIFIER} (+${PACKAGE.homepage})`;
