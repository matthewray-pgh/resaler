/**
 * useApi — the app's data access surface. Backed directly by the Mac.bid
 * API from the browser (see ../lib/macbidClient); no server involved.
 */

import { macbid } from "../lib/macbidClient";

export const api = {
  // Auth
  checkStatus:  ()             => macbid.checkStatus(),
  login:        (email, pw)    => macbid.login(email, pw),
  verify:       (code)         => macbid.verify(code),
  logout:       ()             => macbid.logout(),

  // Data
  getWatchlist: ()             => macbid.getWatchlist(),
  getLocations: ()             => macbid.getLocations(),
  getAuctions:  (locationId)   => macbid.getAuctions(locationId),
  getActive:    ()             => macbid.getActive(),
};
