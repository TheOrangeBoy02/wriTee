import React, { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';

interface CustomMarkdownStyles {
  u: TextStyle;
  strikethrough: TextStyle;
}

interface MarkdownNode {
  key: string | number;
}

type CustomMarkdownRules = {
  textgroup: (
    node: MarkdownNode,
    children: ReactNode,
    _parent: unknown,
    styles: CustomMarkdownStyles
  ) => ReactNode;
};

export const customMarkdownRules: CustomMarkdownRules = {
  textgroup: (node, children, _parent, styles) => {
    if (typeof children === 'string') {
      const parts = children.split(/(<u>.*?<\/u>|~~.*?~~)/g);
      return (
        <Text key={node.key}>
          {parts.map((part, index) => {
            if (part.startsWith('<u>')) {
              const text = part.replace(/<\/?u>/g, '');
              return <Text key={index} style={styles.u}>{text}</Text>;
            }
            if (part.startsWith('~~')) {
              const text = part.replace(/~~/g, '');
              return <Text key={index} style={styles.strikethrough}>{text}</Text>;
            }
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
      );
    }
    return <Text key={node.key}>{children}</Text>;
  },
};
export const customMarkdownStyles = {
  u: {
    textDecorationLine: 'underline',
    color: '#6C0BA9', // Muted purple for underlined text
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#B39DDB', // Light purple for strikethrough text
  },
};