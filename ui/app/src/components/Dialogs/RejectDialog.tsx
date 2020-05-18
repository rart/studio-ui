/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import React, { PropsWithChildren, useEffect, useState } from 'react';
import StandardAction from '../../models/StandardAction';
import Dialog from '@material-ui/core/Dialog';
import { useActiveSiteId, useLogicResource, useSpreadState, useUnmount } from '../../utils/hooks';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { createStyles } from '@material-ui/core';
import { LegacyItem } from '../../models/Item';
import DialogHeader from './DialogHeader';
import { FormattedMessage } from 'react-intl';
import DialogBody from './DialogBody';
import { SuspenseWithEmptyState } from '../SystemStatus/Suspencified';
import { Resource } from '../../models/Resource';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import DialogFooter from './DialogFooter';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import { palette } from '../../styles/theme';
import { fetchDependencies } from '../../services/dependencies';
import { reject } from '../../services/publishing';
import { ApiResponse } from '../../models/ApiResponse';

// region Typings

type ApiState = { error: ApiResponse, submitting: boolean };
type Source = LegacyItem[];
type Return = Source;

interface RejectDialogContentUIProps {
  resource: Resource<Return>;
  checkedItems: string[];
  onUpdateChecked?(value?: string): void;
  classes?: any;
}

interface RejectDialogUIProps {
  resource: Resource<Return>;
  checkedItems: string[];
  rejectionReason: string;
  rejectionComment: string;
  setRejectionReason?(value: string): void;
  setRejectionComment?(value: string): void;
  onUpdateChecked?(value?: string): void;
  classes?: any;
  onReject?(): void;
  onClose?(): void;
  onDismiss?(): void;
}

interface RejectDialogBaseProps {
  open: boolean;
  items?: LegacyItem[];
}

export type RejectDialogProps = PropsWithChildren<RejectDialogBaseProps & {
  onClose?(response?: any): any;
  onClosed?(response?: any): any;
  onDismiss?(response?: any): any;
  onRejectSuccess?(response?: any): any;
}>;

export interface RejectDialogStateProps extends RejectDialogBaseProps {
  onClose?: StandardAction;
  onClosed?: StandardAction;
  onDismiss?: StandardAction;
  onRejectSuccess?: StandardAction;
}

// endregion

const useStyles = makeStyles(() =>
  createStyles({
    itemsList: {
      border: '1px solid #D8D8DC',
      backgroundColor: palette.white,
      padding: 0,
      height: '100%'
    },
    submissionTextField: {
      marginTop: '10px'
    },
    textField: {
      padding: 0,
      '& textarea[aria-hidden="true"]': {
        width: '50% !important'
      }
    }
  })
);

const SelectInput = withStyles(() => createStyles({
  input: {
    borderRadius: 4
  }
}))(InputBase);

function RejectDialogContentUI(props: RejectDialogContentUIProps) {
  const {
    resource,
    checkedItems,
    onUpdateChecked,
    classes
  } = props;

  const rejectItems = resource.read();

  return (
    <List className={classes.itemsList}>
      {
        rejectItems.map(file => {
          const labelId = `checkbox-list-label-${file.uri}`;

          return (
            <ListItem key={file.uri} onClick={() => onUpdateChecked(file.uri)} button>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checkedItems.includes(file.uri)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                  color="primary"
                />
              </ListItemIcon>
              <ListItemText primary={file.name} secondary={file.uri} id={labelId}/>
            </ListItem>
          );
        })
      }
    </List>
  );
}

function RejectDialogUI(props: RejectDialogUIProps) {
  const {
    resource,
    checkedItems,
    rejectionReason,
    rejectionComment,
    setRejectionReason,
    setRejectionComment,
    onUpdateChecked,
    onClose,
    onDismiss,
    onReject,
    classes
  } = props;

  return (
    <>
      <DialogHeader
        id="workflowCancellationDialogTitle"
        title={
          <FormattedMessage
            id="workflowCancellation.title" defaultMessage="Reject"
          />
        }
        subtitle={
          <FormattedMessage
            id="workflowCancellation.subtitle"
            defaultMessage="The following checked item(s) will be rejected."
          />
        }
        onDismiss={onDismiss}
      />
      <DialogBody id="confirmDialogBody">
        <Grid container spacing={3} className={classes.contentRoot}>
          <Grid item xs={12} sm={7} md={7} lg={7} xl={7}>
            <SuspenseWithEmptyState
              resource={resource}
              withEmptyStateProps={{
                emptyStateProps: {
                  title: (
                    <FormattedMessage
                      id="publishDialog.noItemsSelected"
                      defaultMessage="There are no affected files"
                    />
                  )
                },
                isEmpty: (value) => value.length === 0
              }}
            >
              <RejectDialogContentUI
                resource={resource}
                checkedItems={checkedItems}
                onUpdateChecked={onUpdateChecked}
                classes={classes}
              />

            </SuspenseWithEmptyState>
          </Grid>

          <Grid item xs={12} sm={5} md={5} lg={5} xl={5}>
            <form>
              <FormControl fullWidth>
                <InputLabel className={classes.sectionLabel}>
                  <FormattedMessage
                    id="rejectDialog.rejectionReason" defaultMessage="Rejection Reason"
                  />:
                </InputLabel>
                <Select
                  fullWidth
                  input={<SelectInput />}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value as string)}
                >
                  <MenuItem key={'NotApproved'} value={'NotApproved'}>
                    <FormattedMessage id="rejectDialog.notApproved" defaultMessage="Not Approved" />
                  </MenuItem>
                  <MenuItem key={'IncorrectBranding'} value={'IncorrectBranding'}>
                    <FormattedMessage
                      id="rejectDialog.incorrectBranding" defaultMessage="Incorrect Branding"
                    />
                  </MenuItem>
                  <MenuItem key={'Typos'} value={'Typos'}>
                    <FormattedMessage id="rejectDialog.typos" defaultMessage="Typos" />
                  </MenuItem>
                  <MenuItem key={'BrokenLinks'} value={'BrokenLinks'}>
                    <FormattedMessage id="rejectDialog.brokenLinks" defaultMessage="Broken Links" />
                  </MenuItem>
                  <MenuItem key={'NSOA'} value={'NSOA'}>
                    <FormattedMessage
                      id="rejectDialog.nsoa" defaultMessage="Needs Section Owner's Approval"
                    />
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                className={classes.submissionTextField}
                label={<FormattedMessage
                  id="rejectDialog.rejectCommentLabel" defaultMessage="Rejection Comment"
                />}
                fullWidth
                multiline
                rows={8}
                defaultValue={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value as string)}
                InputProps={{
                  className: classes.textField
                }}
              />
            </form>
          </Grid>
        </Grid>
      </DialogBody>
      <DialogFooter>
        <DialogActions>
          {onClose && (
            <Button onClick={onClose} variant="contained">
              <FormattedMessage id="rejectDialog.cancel" defaultMessage="Cancel" />
            </Button>
          )}
          {onReject && (
            <Button
              onClick={onReject}
              variant="contained"
              color="primary"
              autoFocus
              disabled={checkedItems.length === 0 || rejectionComment === '' || rejectionReason === ''}
            >
              <FormattedMessage id="rejectDialog.continue" defaultMessage="Reject" />
            </Button>
          )}
        </DialogActions>
      </DialogFooter>
    </>
  );
}

export default function RejectDialog(props: RejectDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      aria-labelledby="rejectDialogTitle"
      fullWidth
      maxWidth="md"
    >
      <RejectDialogWrapper {...props} />
    </Dialog>
  );
}

function RejectDialogWrapper(props: RejectDialogProps) {
  const {
    items,
    onClose,
    onClosed,
    onDismiss,
    onRejectSuccess
  } = props;
  useUnmount(onClosed);
  const [checkedItems, setCheckedItems] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const siteId = useActiveSiteId();
  const [apiState, setApiState] = useSpreadState<ApiState>({
    error: null,
    submitting: false
  });

  // check all items as default
  useEffect(() => {
    const newChecked = [];

    items.forEach((item) => {
      const uri = item.uri;
      newChecked.push(uri);
    });

    setCheckedItems(newChecked);
  }, [items, setCheckedItems]);

  const updateChecked = (value) => {
    const itemExist = checkedItems.includes(value);
    const newChecked = [...checkedItems];

    if (itemExist) {
      newChecked.splice(newChecked.indexOf(value), 1);
    } else {
      newChecked.push(value);
    }

    setCheckedItems(newChecked);
  };

  const onReject = () => {
    fetchDependencies(siteId, checkedItems).subscribe(
      (response) => {
        // api being used in legacy (/studio/api/1/services/api/1/dependency/get-dependencies.json)
        // returns only softDependencies
        const deps = response.softDependencies;

        setApiState({ ...apiState, submitting: true });

        reject(siteId, deps, checkedItems, rejectionReason, rejectionComment).subscribe(
          () => {
            setApiState({ error: null, submitting: false });
            onRejectSuccess?.();
            onDismiss?.();
          },
          (error) => {
            setApiState({ error: null, submitting: false });
            setApiState({ error });
          }
        );
      },
      (error) => {
        setApiState({ error });
      }
    );
  };

  const resource = useLogicResource<Return, Source>(items, {
    shouldResolve: (source) => Boolean(source),
    shouldReject: (source) => false,
    shouldRenew: (source, resource) => resource.complete,
    resultSelector: (source) => source,
    errorSelector: (source) => null
  });

  return (
    <RejectDialogUI
      resource={resource}
      checkedItems={checkedItems}
      rejectionReason={rejectionReason}
      setRejectionReason={setRejectionReason}
      rejectionComment={rejectionComment}
      setRejectionComment={setRejectionComment}
      onUpdateChecked={updateChecked}
      onClose={onClose}
      onDismiss={onDismiss}
      onReject={onReject}
      classes={useStyles()}
    />
  );
}
