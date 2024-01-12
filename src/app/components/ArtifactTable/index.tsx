/**
 *
 * ArtifactTable
 *
 */
import { ButtonGroup, Button, Checkbox, Spinner, Tag } from '@blueprintjs/core';
import _ from 'lodash';
import { Column, Cell, Table2 } from '@blueprintjs/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApcApi } from 'api/apc';
import React, { memo, useState } from 'react';
import styled from 'styled-components/macro';
import './ArtifactTable.scss';
import { Processor } from '../../../types/Processor';
import { AuxField } from 'types/AuxField';
import { useKeycloak } from '@react-keycloak-fork/web';
import { Artifact } from 'types';
import { InspectButton } from './InspectButton';
import { ArtifactInspector } from 'app/components/ArtifactInspector';
import { AxiosResponse } from 'axios';
import { SearchBar } from './SearchBar';

interface Props {
  processor: Processor;
}

const FilterObject = (filter: string, artifact: any, deep_filter = false) => {
  if (artifact === undefined || artifact === null) {
    return false;
  }
  const keys = Object.keys(artifact);
  for (let i in keys) {
    const key = keys[i];
    const value = artifact[key];
    if (deep_filter && typeof value === 'object') {
      if (FilterObject(filter, value, deep_filter)) {
        return true;
      }
    } else {
      if (('' + value).toLowerCase().includes(filter.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
};

const FilterArtifacts = (
  filter: string,
  artifacts: Artifact[],
  deep_filter = false,
) => {
  if (filter === '') {
    return artifacts;
  }
  return _.filter(artifacts, artifact =>
    FilterObject(filter, artifact, deep_filter),
  );
};

export const ArtifactTable = memo((props: Props) => {
  const apc = useApcApi();
  const { keycloak } = useKeycloak();
  const query_client = useQueryClient();
  const [only_roots, SetOnlyRoots] = useState(true);
  const [deep_filter, SetDeepFilter] = useState(false);
  const [inspect, SetInspect] = useState<null | Artifact>(null);
  const [search_filter, SetSearchFilter] = useState('');
  const query = useQuery(
    ['artifact_table', props.processor.id, only_roots],
    apc.GetAllProcessorArtifacts,
  );

  const mutation = useMutation({
    mutationFn: apc.DeleteArtifact,
    onSuccess: (data: AxiosResponse<Artifact>) => {
      const artifact = data.data;
      query_client.invalidateQueries({
        queryKey: ['artifact_table', artifact.processor, true],
      });
    },
  });

  if (query.isLoading) {
    return <Spinner />;
  }

  const aux_columns = _.map(
    JSON.parse(props.processor.config),
    (field: AuxField) => {
      return {
        key: `config.${field.key}`,
        interactive: false,
      };
    },
  );

  const columns = [
    { key: 'id', interactive: false },
    { key: 'processor', interactive: false },
    { key: 'filter' },
    {
      key: 'root',
      interactive: true,
      render: (row: any, key: string) => (
        <Center>
          <Tag intent={row[key] ? 'success' : 'warning'}>
            {row[key] ? 'root' : 'branch'}
          </Tag>
        </Center>
      ),
    },
    {
      key: 'versions',
      interactive: false,
      render: (row: any, key: string) => (
        <Center>{_.keys(row[key]).length}</Center>
      ),
    },
    {
      key: 'dependencies',
      interactive: false,
      render: (row: any, key: string) => (
        <Center>{_.keys(row[key]).length}</Center>
      ),
    },
    ...aux_columns,
    {
      key: 'action',
      interactive: true,
      render: (row: Artifact) => (
        <Center>
          <ButtonGroup>
            <InspectButton artifact={row} onInspect={SetInspect} />
            <Button
              intent="danger"
              disabled={!keycloak.hasResourceRole('Administrator')}
              onClick={() =>
                mutation.mutate({ id: row.id, processor: row.processor })
              }
              loading={mutation.isLoading}
              small
            >
              Delete
            </Button>
          </ButtonGroup>
        </Center>
      ),
    },
  ];

  const data = _.sortBy(query.data?.data, 'id');

  const artifacts = FilterArtifacts(
    search_filter,
    only_roots ? _.filter(data, (artifact: Artifact) => artifact.root) : data,
    deep_filter,
  );

  const RenderBasic = (row_idx: number, col_idx: number) => {
    const column = columns[col_idx];
    const value = _.get(artifacts[row_idx], column.key);
    const render = 'render' in column ? column.render : undefined;
    return (
      <Cell interactive={column.interactive} className="artifact-table-cell">
        {render ? render(artifacts[row_idx], column.key) : value}
      </Cell>
    );
  };

  return (
    <Div>
      <Checkbox
        label="Only roots"
        checked={only_roots}
        onChange={() => SetOnlyRoots(!only_roots)}
      />
      <Checkbox
        label="Deep filtering (includes searching in dependencies)"
        checked={deep_filter}
        onChange={() => SetDeepFilter(!deep_filter)}
      />
      <SearchBar value={search_filter} onChange={SetSearchFilter}></SearchBar>
      <Table2
        enableColumnResizing
        defaultRowHeight={30}
        numRows={artifacts.length}
      >
        {columns.map(column => (
          <Column
            key={column.key}
            name={column.key}
            cellRenderer={RenderBasic}
          />
        ))}
      </Table2>
      <ArtifactInspector onClose={() => SetInspect(null)} artifact={inspect} />
    </Div>
  );
});
const Center = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
`;

const Div = styled.div`
  width: 100%;
  height: 80vh;
`;
