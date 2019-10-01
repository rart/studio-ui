/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import '../styles/index.scss';

import React, { Suspense } from 'react';
import { createIntl, createIntlCache, IntlProvider, RawIntlProvider } from 'react-intl';
import cookies from "js-cookie";
import { setGlobalHeaders } from "../utils/ajax";
import ThemeProvider from "@material-ui/styles/ThemeProvider/ThemeProvider";
import { theme } from "../styles/theme";

const cache = createIntlCache();
const token = cookies.get('XSRF-TOKEN');
setGlobalHeaders({'X-XSRF-TOKEN': token});

export const intl = createIntl({
  locale: 'en',
  messages: {}
}, cache);

function CrafterCMSNextBridge(props: any) {
  return (
    <RawIntlProvider value={intl}>
      <ThemeProvider theme={theme}>
        <Suspense fallback={'Loading...'}>
          {props.children}
        </Suspense>
      </ThemeProvider>
    </RawIntlProvider>
  );
}

export default CrafterCMSNextBridge;
