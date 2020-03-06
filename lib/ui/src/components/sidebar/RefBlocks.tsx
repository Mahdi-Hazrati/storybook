import { window } from 'global';
import React, {
  FunctionComponent,
  useState,
  useCallback,
  Fragment,
  ComponentPropsWithoutRef,
  useContext,
} from 'react';
import { Icons, WithTooltip, Spaced, Button } from '@storybook/components';
import { logger } from '@storybook/client-logger';
import { useStorybookApi } from '@storybook/api';
import { styled } from '@storybook/theming';
import { Location } from '@storybook/router';
import { Tree } from './Tree/Tree';
import { Loader, Contained } from './Loader';
import { MessageWrapper } from './RefIndicator';
import { Item, DataSet, BooleanSet } from './Refs';
import { ListItem } from './Tree/ListItem';
import { ExpanderContext } from './Tree/State';

const RootHeading = styled.div(({ theme }) => ({
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  fontWeight: theme.typography.weight.black,
  fontSize: theme.typography.size.s1 - 1,
  lineHeight: '24px',
  color: theme.color.mediumdark,
  margin: '0 20px',
}));
RootHeading.defaultProps = {
  className: 'sidebar-subheading',
};

const Text = styled.p(({ theme }) => ({
  fontSize: theme.typography.size.s2 - 1,

  margin: 0,
}));

const Components = {
  Head: (props: ComponentPropsWithoutRef<typeof ListItem>) => {
    const api = useStorybookApi();
    const { setExpanded, expandedSet } = useContext(ExpanderContext);
    const { id, isComponent, childIds } = props;

    const onClick = useCallback(
      e => {
        e.preventDefault();
        if (!expandedSet[id] && isComponent && childIds && childIds.length) {
          api.selectStory(childIds[0]);
        }
        setExpanded(s => ({ ...s, [id]: !s[id] }));
      },
      [id, expandedSet[id]]
    );
    return <ListItem onClick={onClick} {...props} href={`#${id}`} />;
  },
  Leaf: (props: ComponentPropsWithoutRef<typeof ListItem>) => {
    const api = useStorybookApi();
    const { setExpanded } = useContext(ExpanderContext);
    const { id } = props;
    const onClick = useCallback(
      e => {
        e.preventDefault();
        api.selectStory(id);
        setExpanded(s => ({ ...s, [id]: !s[id] }));
      },
      [id]
    );

    return (
      <Location>
        {({ viewMode }) => (
          <ListItem onClick={onClick} {...props} href={`?path=/${viewMode}/${id}`} />
        )}
      </Location>
    );
  },
  Branch: Tree,
  List: styled.div({}),
};

const Section = styled.section();

export const AuthBlock: FunctionComponent<{ authUrl: string; id: string }> = ({ authUrl, id }) => {
  const [isAuthAttempted, setAuthAttempted] = useState(false);

  const refresh = useCallback(() => {
    window.document.location.reload();
  }, []);

  const open = useCallback(e => {
    e.preventDefault();
    const childWindow = window.open(authUrl, `storybook_auth_${id}`, 'resizable,scrollbars');

    // poll for window to close
    const timer = setInterval(() => {
      if (!childWindow) {
        logger.error('unable to access authUrl window');
        clearInterval(timer);
      } else if (childWindow.closed) {
        clearInterval(timer);
        setAuthAttempted(true);
      }
    }, 1000);
  }, []);

  return (
    <Contained>
      <Spaced>
        {isAuthAttempted ? (
          <Fragment>
            <Text>
              Authentication on <strong>{authUrl}</strong> seems to have concluded, refresh the page
              to fetch this storybook
            </Text>
            <div>
              <Button small gray onClick={refresh}>
                <Icons icon="sync" />
                Refresh the page
              </Button>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <Text>Browse this secure storybook</Text>
            <div>
              <Button small gray onClick={open}>
                <Icons icon="lock" />
                Login
              </Button>
            </div>
          </Fragment>
        )}
      </Spaced>
    </Contained>
  );
};

export const ErrorBlock: FunctionComponent<{ error: Error }> = ({ error }) => (
  <Contained>
    <Spaced>
      <Text>Ow now! something went wrong loading this storybook</Text>
      <WithTooltip
        trigger="click"
        tooltip={
          <MessageWrapper>
            <pre>{error.toString()}</pre>
          </MessageWrapper>
        }
      >
        <Button small gray>
          <Icons icon="doclist" />
          View error
        </Button>
      </WithTooltip>
    </Spaced>
  </Contained>
);

export const LoaderBlock: FunctionComponent<{ isMain: boolean }> = ({ isMain }) => (
  <Contained>
    <Loader size={isMain ? 'multiple' : 'single'} />
  </Contained>
);

export const ContentBlock: FunctionComponent<{
  others: Item[];
  dataSet: DataSet;
  selectedSet: BooleanSet;
  expandedSet: BooleanSet;
  roots: Item[];
}> = ({ others, dataSet, selectedSet, expandedSet, roots }) => (
  <Fragment>
    <Spaced row={1.5}>
      {others.length ? (
        <Section data-title="categorized" key="categorized">
          {others.map(({ id }) => (
            <Tree
              key={id}
              depth={0}
              dataset={dataSet}
              selected={selectedSet}
              expanded={expandedSet}
              root={id}
              {...Components}
            />
          ))}
        </Section>
      ) : null}

      {roots.map(({ id, name, children }) => (
        <Section data-title={name} key={id}>
          <RootHeading>{name}</RootHeading>
          {children.map(child => (
            <Tree
              key={child}
              depth={0}
              dataset={dataSet}
              selected={selectedSet}
              expanded={expandedSet}
              root={child}
              {...Components}
            />
          ))}
        </Section>
      ))}
    </Spaced>
  </Fragment>
);
