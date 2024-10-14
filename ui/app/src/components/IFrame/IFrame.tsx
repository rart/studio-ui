/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { makeStyles } from 'tss-react/mui';
import Box, { BoxProps } from '@mui/material/Box';
import { CSSObject as CSSProperties } from 'tss-react';

export type IFrameClassKey = 'iframe' | 'iframeWithBorder' | 'iframeWithBorderLandscape' | 'iframeWithBorderPortrait';

export type IFrameStyles = Partial<Record<IFrameClassKey, CSSProperties>>;

const useStyles = makeStyles<IFrameStyles, IFrameClassKey>()(
  (theme, { iframe, iframeWithBorder, iframeWithBorderPortrait, iframeWithBorderLandscape }) => ({
    iframe: {
      width: '100%',
      maxWidth: '100%',
      border: 'none',
      height: '100%',
      transition: 'width .25s ease, height .25s ease',
      ...iframe
    },
    iframeWithBorder: {
      borderRadius: 20,
      borderColor: '#555',
      ...iframeWithBorder
    },
    iframeWithBorderLandscape: {
      borderWidth: '10px 50px',
      ...iframeWithBorderLandscape
    },
    iframeWithBorderPortrait: {
      borderWidth: '50px 10px',
      ...iframeWithBorderPortrait
    }
  })
);

interface IFrameProps {
  sx?: BoxProps['sx'];
  styles?: Partial<Record<IFrameClassKey, CSSProperties>>;
  url: string;
  title: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  border?: 'portrait' | 'landscape';
  onLoadComplete?(): void;
}

export function IFrame(props: IFrameProps) {
  const { url, title, width, height, border, className, onLoadComplete, sx, styles } = props;
  const { classes, cx } = useStyles(styles);

  const cls = cx(classes.iframe, {
    [className || '']: !!className,
    [classes.iframeWithBorder]: border != null,
    [classes.iframeWithBorderPortrait]: border === 'landscape',
    [classes.iframeWithBorderLandscape]: border === 'portrait'
  });

  return (
    <Box
      component="iframe"
      style={{ width, height }}
      title={title}
      onLoad={onLoadComplete}
      src={url || 'about:blank'}
      className={cls}
      sx={sx}
    />
  );
}

export default IFrame;
