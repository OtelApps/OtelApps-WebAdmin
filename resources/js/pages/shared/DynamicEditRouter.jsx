import React from 'react';
import { useParams } from 'react-router-dom';

import { CardEdit } from './CardEdit';

/**
 * Centrální směrovač pro editaci modulů.
 * Aktuálně využíváme jednotnou univerzální komponentu CardEdit.
 */
export function DynamicEditRouter() {
    return <CardEdit />;
}
