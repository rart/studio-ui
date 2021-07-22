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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LookupTable from '../../models/LookupTable';
import ApiResponse from '../../models/ApiResponse';
import { AllItemActions, DetailedItem } from '../../models/Item';
import { fetchLegacyUserActivities } from '../../services/dashboard';
import useStyles from './styles';
import { getNumOfMenuOptionsForItem, getSystemTypeFromPath, parseLegacyItemToDetailedItem } from '../../utils/content';
import Dashlet from '../Dashlet';
import { FormattedMessage, useIntl } from 'react-intl';
import { SuspenseWithEmptyState } from '../SystemStatus/Suspencified';
import RecentActivityDashletGridUI from '../RecentActivityDashletGrid/RecentActivityDashletGridUI';
import { useDispatch, useSelector } from 'react-redux';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import RecentActivityDashletUiSkeleton from '../RecentActivityDashletGrid/RecentActivityDashletUISkeleton';
import GlobalState from '../../models/GlobalState';
import { itemsApproved, itemsDeleted, itemsRejected, itemsScheduled } from '../../state/actions/system';
import { getHostToHostBus } from '../../modules/Preview/previewContext';
import { filter } from 'rxjs/operators';
import TextField from '@material-ui/core/TextField';
import { useActiveSiteId } from '../../utils/hooks/useActiveSiteId';
import { useLogicResource } from '../../utils/hooks/useLogicResource';
import { useLocale } from '../../utils/hooks/useLocale';
import { DashboardPreferences } from '../../models/Dashboard';
import { useSpreadState } from '../../utils/hooks/useSpreadState';
import { getStoredDashboardPreferences, setStoredDashboardPreferences } from '../../utils/state';
import { createPresenceTable } from '../../utils/array';
import { completeDetailedItem } from '../../state/actions/content';
import { showItemMegaMenu } from '../../state/actions/dialogs';
import { itemActionDispatcher } from '../../utils/itemActions';
import { useEnv } from '../../utils/hooks/useEnv';
import ActionsBar from '../ActionsBar';
import translations from '../AwaitingApprovalDashlet/translations';

const dashletInitialPreferences: DashboardPreferences = {
  filterBy: 'page',
  numItems: 10,
  expanded: true,
  excludeLiveItems: false
};

export default function RecentActivityDashlet() {
  const [fetchingActivity, setFetchingActivity] = useState(false);
  const [errorActivity, setErrorActivity] = useState<ApiResponse>();
  const [items, setItems] = useState<DetailedItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const siteId = useActiveSiteId();
  const currentUser = useSelector<GlobalState, string>((state) => state.user.username);
  const dashletPreferencesId = 'recentActivityDashlet';
  const [preferences, setPreferences] = useSpreadState(
    getStoredDashboardPreferences(currentUser, siteId, dashletPreferencesId) ?? dashletInitialPreferences
  );
  const [selectedLookup, setSelectedLookup] = useState<LookupTable<boolean>>({});
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState('dateModified');
  const locale = useLocale();
  const classes = useStyles();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { authoringBase } = useEnv();

  const isAllChecked = useMemo(() => !items.some((item) => !selectedLookup[item.path]), [items, selectedLookup]);
  const isIndeterminate = useMemo(() => items.some((item) => selectedLookup[item.path] && !isAllChecked), [
    items,
    selectedLookup,
    isAllChecked
  ]);
  const selectedItemsLength = useMemo(() => Object.values(selectedLookup).filter(Boolean).length, [selectedLookup]);

  const onFilterChange = (e) => {
    e.stopPropagation();
    setPreferences({
      filterBy: e.target.value
    });
  };

  const onNumItemsChange = (e) => {
    e.stopPropagation();
    setPreferences({
      numItems: e.target.value
    });
  };

  useEffect(() => {
    setStoredDashboardPreferences(preferences, currentUser, siteId, dashletPreferencesId);
  }, [preferences, currentUser, siteId]);

  const onToggleHideLiveItems = (e) => {
    e.stopPropagation();
    setPreferences({ excludeLiveItems: !preferences.excludeLiveItems });
  };

  const toggleSortType = () => {
    setSortType(sortType === 'asc' ? 'desc' : 'asc');
  };

  const fetchActivity = useCallback(() => {
    setFetchingActivity(true);
    fetchLegacyUserActivities(
      siteId,
      currentUser,
      'eventDate',
      true,
      preferences.numItems,
      preferences.filterBy,
      preferences.excludeLiveItems
    ).subscribe(
      (activities) => {
        setTotalItems(activities.total);
        const itemsList = [];
        activities.documents.forEach((item) => itemsList.push(parseLegacyItemToDetailedItem(item)));
        setItems(itemsList);
        setFetchingActivity(false);
      },
      (e) => {
        setErrorActivity(e);
        setFetchingActivity(false);
      }
    );
  }, [siteId, currentUser, preferences.numItems, preferences.filterBy, preferences.excludeLiveItems]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // region Item Updates Propagation
  useEffect(() => {
    const events = [itemsDeleted.type, itemsRejected.type, itemsApproved.type, itemsScheduled.type];
    const hostToHost$ = getHostToHostBus();
    const subscription = hostToHost$.pipe(filter((e) => events.includes(e.type))).subscribe(({ type, payload }) => {
      switch (type) {
        case itemsApproved.type:
        case itemsScheduled.type:
        case itemsDeleted.type:
        case itemsRejected.type: {
          if (payload.targets.some((path) => selectedLookup[path])) {
            fetchActivity();
          }
          break;
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchActivity, selectedLookup]);
  // endregion

  const resource = useLogicResource<DetailedItem[], { items: DetailedItem[]; error: ApiResponse; fetching: boolean }>(
    useMemo(() => ({ items, error: errorActivity, fetching: fetchingActivity }), [
      items,
      errorActivity,
      fetchingActivity
    ]),
    {
      shouldResolve: (source) => Boolean(source.items) && !fetchingActivity,
      shouldReject: ({ error }) => Boolean(error),
      shouldRenew: (source, resource) => fetchingActivity && resource.complete,
      resultSelector: (source) => source.items,
      errorSelector: () => errorActivity
    }
  );

  const onToggleCheckedAll = () => {
    if (isAllChecked) {
      setSelectedLookup({});
    } else {
      setSelectedLookup({ ...selectedLookup, ...createPresenceTable(items, true, (item) => item.path) });
    }
  };

  const handleItemChecked = (path: string) => {
    setSelectedLookup({ ...selectedLookup, [path]: !selectedLookup[path] });
  };

  const onItemMenuClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, item: DetailedItem) => {
    const path = item.path;
    dispatch(completeDetailedItem({ path }));
    dispatch(
      showItemMegaMenu({
        path,
        anchorReference: 'anchorPosition',
        anchorPosition: { top: event.clientY, left: event.clientX },
        numOfLoaderItems: getNumOfMenuOptionsForItem({
          path: item.path,
          systemType: getSystemTypeFromPath(item.path)
        } as DetailedItem)
      })
    );
  };

  const onActionBarOptionClicked = (option: string) => {
    if (option === 'clear') {
      setSelectedLookup({});
    } else {
      itemActionDispatcher({
        site: siteId,
        item: items.filter((item) => selectedLookup[item.path]),
        option: option as AllItemActions,
        authoringBase,
        dispatch,
        formatMessage
      });
    }
  };

  return (
    <Dashlet
      title={
        <>
          <FormattedMessage id="recentActivity.myRecentActivity" defaultMessage="My Recent Activity" /> ({items.length})
        </>
      }
      onToggleExpanded={() => setPreferences({ expanded: !preferences.expanded })}
      expanded={preferences.expanded}
      refreshDisabled={fetchingActivity}
      onRefresh={fetchActivity}
      headerRightSection={
        <>
          <Button onClick={onToggleHideLiveItems} className={classes.rightAction}>
            {preferences.excludeLiveItems ? (
              <FormattedMessage id="recentActivity.showLiveItems" defaultMessage="Show Live Items" />
            ) : (
              <FormattedMessage id="recentActivity.hideLiveItems" defaultMessage="Hide Live Items" />
            )}
          </Button>
          <TextField
            label={<FormattedMessage id="words.show" defaultMessage="Show" />}
            select
            size="small"
            value={preferences.numItems}
            disabled={fetchingActivity}
            onChange={onNumItemsChange}
            className={classes.rightAction}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            {totalItems > 0 && (
              <MenuItem value={totalItems}>
                <FormattedMessage id="words.all" defaultMessage="All" /> ({totalItems})
              </MenuItem>
            )}
          </TextField>
          <TextField
            label={<FormattedMessage id="recentActivity.filterBy" defaultMessage="Filter by" />}
            select
            size="small"
            value={preferences.filterBy}
            disabled={fetchingActivity}
            onChange={onFilterChange}
          >
            <MenuItem value="page">
              <FormattedMessage id="words.pages" defaultMessage="Pages" />
            </MenuItem>
            <MenuItem value="components">
              <FormattedMessage id="words.components" defaultMessage="Components" />
            </MenuItem>
            <MenuItem value="all">
              <FormattedMessage id="words.all" defaultMessage="All" />
            </MenuItem>
          </TextField>
        </>
      }
    >
      <SuspenseWithEmptyState
        resource={resource}
        suspenseProps={{
          fallback: <RecentActivityDashletUiSkeleton numOfItems={items.length} />
        }}
      >
        {(isIndeterminate || isAllChecked) && (
          <ActionsBar
            classes={{
              root: classes.actionsBarRoot,
              checkbox: classes.actionsBarCheckbox
            }}
            options={[
              { id: 'approvePublish', label: formatMessage(translations.publish, { count: selectedItemsLength }) },
              { id: 'rejectPublish', label: formatMessage(translations.reject, { count: selectedItemsLength }) },
              { id: 'clear', label: formatMessage(translations.clear) }
            ]}
            isIndeterminate={isIndeterminate}
            isChecked={isAllChecked}
            onOptionClicked={onActionBarOptionClicked}
            toggleSelectAll={onToggleCheckedAll}
          />
        )}
        <RecentActivityDashletGridUI
          resource={resource}
          onOptionsButtonClick={onItemMenuClick}
          selectedLookup={selectedLookup}
          isAllChecked={isAllChecked}
          isIndeterminate={isIndeterminate}
          locale={locale}
          sortType={sortType}
          toggleSortType={toggleSortType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onItemChecked={handleItemChecked}
          onClickSelectAll={onToggleCheckedAll}
        />
      </SuspenseWithEmptyState>
    </Dashlet>
  );
}
