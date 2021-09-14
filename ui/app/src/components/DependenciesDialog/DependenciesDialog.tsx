/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
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
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Dialog from '../Dialog';
import { DependenciesDialogContainer } from './DependenciesDialogContainer';
import { DependenciesDialogProps } from './utils';

export const dependenciesDialogStyles = makeStyles((theme) =>
  createStyles({
    dialogBody: {
      overflow: 'auto',
      minHeight: '50vh'
    },
    selectionContent: {
      marginBottom: '15px',
      display: 'flex'
    },
    dialogFooter: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2)
    },
    formControl: {
      minWidth: 120,
      marginLeft: 'auto'
    },
    select: {
      fontSize: '16px',
      border: 'none',
      background: 'none'
    },
    dependenciesList: {
      backgroundColor: theme.palette.background.paper,
      padding: 0,
      borderRadius: '5px 5px 0 0',
      overflowY: 'auto'
    },
    dependenciesListItem: {
      padding: 0,
      height: '70px'
    },
    dependenciesCompactListItem: {
      height: '43px'
    },
    listItemPreview: {
      width: '100px',
      height: '70px',
      borderRadius: 0
    },
    listItemContent: {
      paddingLeft: '15px'
    },
    compactViewAction: {
      marginRight: 'auto'
    },
    showTypesSelect: {
      '& > .MuiRadio-root': {
        display: 'none'
      }
    },
    showTypesMenu: {
      '& .MuiListItem-root': {
        padding: '0 10px',
        fontSize: '14px',
        '& > .MuiRadio-root': {
          padding: '6px',
          '& .MuiSvgIcon-root': {
            width: '16px',
            height: '16px'
          }
        }
      }
    },
    listEllipsis: {
      padding: '8px'
    },
    suspense: {
      height: '100%'
    },
    suspenseTitle: {
      fontSize: '18px',
      fontWeight: 600
    }
  })
);

export default function DependenciesDialog(props: DependenciesDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DependenciesDialogContainer {...props} />
    </Dialog>
  );
}
