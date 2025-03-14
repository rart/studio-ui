import { ContentTypeListingProps } from './ContentTypeListing';
import useContentTypeList from '../../hooks/useContentTypeList';
import Button from '@mui/material/Button';
import AddRounded from '@mui/icons-material/AddRounded';
import { FormattedMessage } from 'react-intl';
import Box from '@mui/material/Box';
import GlobalAppToolbar from '../GlobalAppToolbar';
import SelectContentType from '../SelectContentType/SelectContentType';
import React from 'react';

interface TypeListAppProps {
	renderAppBar?: boolean;
	showOpenLauncherButton?: boolean;
	onTypeSelected?: ContentTypeListingProps['onCardClick'];
}

export function TypeListApp(props: TypeListAppProps) {
	const { renderAppBar = true, showOpenLauncherButton = true, onTypeSelected } = props;
	const contentTypesList = useContentTypeList();
	const loading = contentTypesList == null;
	const createNewButton = (
		<Button variant={renderAppBar ? 'outlined' : 'text'} startIcon={<AddRounded />}>
			<FormattedMessage defaultMessage="Create Type" />
		</Button>
	);
	return (
		<Box height="100%" display="flex" flexDirection="column">
			{renderAppBar && (
				<GlobalAppToolbar
					title={<FormattedMessage id="componentsMessages.contentTypes" defaultMessage="Content Types" />}
					showAppsButton={showOpenLauncherButton}
					leftContent={createNewButton}
				/>
			)}
			<SelectContentType
				contentTypesList={contentTypesList}
				slotProps={{
					box: { sx: { p: 2 } },
					bar: {
						leftChildren: renderAppBar ? undefined : createNewButton
					},
					listing: {
						skeleton: loading,
						skeletonItemCount: 20,
						onCardClick: onTypeSelected
					}
				}}
			/>
		</Box>
	);
}

export default TypeListApp;
