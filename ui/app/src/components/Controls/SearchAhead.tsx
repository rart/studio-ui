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

import InputBase from '@material-ui/core/InputBase';
import React, { useEffect, useMemo, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { useActiveSiteId, useContentTypeList } from '../../utils/hooks';
import { search } from '../../services/search';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { useAutocomplete } from '@material-ui/lab';
import { SearchItem } from '../../models/Search';
import clsx from 'clsx';
import {
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper
} from '@material-ui/core';
import LoadingState from '../SystemStatus/LoadingState';
import EmptyState from '../SystemStatus/EmptyState';
import Page from '../Icons/Page';
import { getPreviewURLFromPath } from '../../utils/path';
import { FormattedMessage } from 'react-intl';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      width: '100%',
      position: 'relative'
    },
    progress: {
      position: 'absolute',
      right: 0
    },
    inputRoot: {
      width: '100%'
    },
    input: {},
    paper: {
      width: 400,
      position: 'absolute',
      right: '-52px',
      top: '50px'
    },
    listBox: {
      overflow: 'auto',
      maxHeight: 600,
      margin: 0,
      padding: 0,
      listStyle: 'none',
      '& li[data-focus="true"]': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)'
      },
      '& li:active': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        color: 'white'
      }
    },
    listItemIcon: {
      minWidth: 'auto',
      paddingRight: '16px'
    },
    EmptyImage: {
      width: '100px'
    },
    highlighted: {
      display: 'inline-block',
      background: 'yellow'
    }
  })
);

export default function(props) {
  const { value, placeholder, disabled, onEnter } = props;
  const classes = useStyles({});
  const onSearch$ = useMemo(() => new Subject<string>(), []);
  const site = useActiveSiteId();
  const contentTypes = useContentTypeList((contentType) => contentType.id.startsWith('/page'));
  const [keyword, setKeyword] = useState('');
  const [isFetching, setIsFetching] = useState(null);
  const [items, setItems] = useState(null);
  const [dirty, setDirty] = useState(false);

  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    popupOpen
  } = useAutocomplete({
    freeSolo: true,
    inputValue: keyword,
    onInputChange: (e, value, reason) => {
      if (reason === 'reset') {
        const previewUrl = getPreviewURLFromPath(value);
        setKeyword(previewUrl);
        onEnter(previewUrl);
        setDirty(false);
      } else {
        setKeyword(value);
        if (value) {
          setIsFetching(true);
          onSearch$.next(value);
          setDirty(true);
        } else {
          setDirty(false);
        }
      }
    },
    options: keyword && items ? items : [],
    filterOptions: (options: SearchItem[], state) => options,
    getOptionLabel: (item: SearchItem) => item.path,
    getOptionSelected: (option: SearchItem, value) => option.path === value.path
  });

  useEffect(() => {
    setKeyword(value);
  }, [value]);

  useEffect(() => {
    const subscription = onSearch$.pipe(debounceTime(400)).subscribe((keyword: string) => {
      search(site, {
        keywords: keyword,
        filters: {
          'content-type': contentTypes.map((contentType) => contentType.id)
        }
      }).subscribe((response) => {
        setIsFetching(false);
        setItems(response.items);
      });
    });
    return () => subscription.unsubscribe();
  }, [contentTypes, onSearch$, site]);

  return (
    <div className={classes.container}>
      <div {...getRootProps()}>
        <InputBase
          {...getInputProps()}
          placeholder={placeholder}
          disabled={disabled}
          classes={{ root: classes.inputRoot, input: clsx(classes.input, props.classes?.input) }}
          endAdornment={
            isFetching ? <CircularProgress className={classes.progress} size={15} /> : null
          }
        />
      </div>
      {/*{popupOpen && dirty && (*/}
      {(
        <Paper className={classes.paper}>
          {isFetching && <LoadingState />}
          {isFetching === false && items?.length > 0 && (
            <List
              dense
              className={classes.listBox}
              subheader={<ListSubheader disableSticky>Pages</ListSubheader>}
              {...getListboxProps()}
            >
              {items.map((option: SearchItem, index) => (
                <ListItem button dense component="li" {...getOptionProps({ option, index })}>
                  <ListItemIcon className={classes.listItemIcon}>
                    <Page />
                  </ListItemIcon>
                  <Option
                    name={option.name}
                    path={option.path}
                    keyword={keyword}
                    highlighted={classes.highlighted}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {isFetching === false && groupedOptions.length === 0 && (
            <EmptyState
              title={<FormattedMessage id="searchAhead.noResults" defaultMessage="No Results." />}
              classes={{ image: classes.EmptyImage }}
            />
          )}
        </Paper>
      )}
    </div>
  );
}

function Option(props) {
  const { name, path, keyword, highlighted } = props;
  const nameMatches = match(name, keyword);
  const pathMatches = match(path, keyword);
  const nameParts = parse(name, nameMatches);
  const pathParts = parse(path, pathMatches);

  return (
    <ListItemText
      primary={
        <>
          {nameParts.map((part, i) =>
            part.highlight ? <span key={i} className={highlighted}> {part.text} </span> : part.text
          )}
        </>
      }
      secondary={
        <>
          {pathParts.map((part, i) =>
            part.highlight ? <span key={i} className={highlighted}> {part.text} </span> : part.text
          )}
        </>
      }
    />
  );
}
