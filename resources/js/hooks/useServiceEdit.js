import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import { parseTextHours, formatTextHours } from '../utils/hoursParser';

export function useServiceEdit({ endpoint, slug, dataKey }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    
    const [data, setData] = useState(null);
    const [openingHours, setOpeningHours] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageKeys, setImageKeys] = useState([]);
    const [iconLibraries, setIconLibraries] = useState(['ionicons', 'material-community']);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        axios
            .get(`${endpoint}/${slug}`)
            .then((res) => {
                setData(res.data[dataKey]);
                
                // Převod hodin z db textu na objekt pro WeeklyHoursPicker
                const rawHours = res.data.opening_hours ?? [];
                setOpeningHours(parseTextHours(rawHours));
                
                setCategories(res.data.categories ?? []);
                setImageKeys(res.data.image_keys ?? []);
                if (res.data.icon_libraries) {
                    setIconLibraries(res.data.icon_libraries);
                }
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Službu se nepodařilo načíst.');
            })
            .finally(() => setLoading(false));
    }, [endpoint, slug, dataKey]);

    useEffect(() => {
        load();
    }, [load]);

    const showSaveStatus = (status) => {
        setSaveStatus(status);
        if (status === 'saved') setTimeout(() => setSaveStatus(null), 2000);
        if (status === 'error') setTimeout(() => setSaveStatus(null), 4000);
    };

    const updateField = (field, value) => {
        setData((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const updateHoursRow = (dayIndex, field, value) => {
        setOpeningHours((prev) =>
            prev.map((row, index) => (index === dayIndex ? { ...row, [field]: value } : row))
        );
    };

    const saveMainData = async (payload) => {
        setSaveStatus('saving');
        try {
            const res = await axios.put(`${endpoint}/${slug}`, payload);
            setData(res.data[dataKey]);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const saveHours = async () => {
        setSaveStatus('saving');
        try {
            const formattedHours = formatTextHours(openingHours);
            const res = await axios.put(`${endpoint}/${slug}/hours`, {
                opening_hours: formattedHours,
            });
            setOpeningHours(parseTextHours(res.data.opening_hours ?? formattedHours));
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    const saveCatalog = async (categoriesPayload) => {
        const payload = categoriesPayload ?? categories;
        setSaveStatus('saving');
        try {
            const res = await axios.put(`${endpoint}/${slug}/catalog`, {
                categories: payload,
            });
            setCategories(res.data.categories ?? []);
            showSaveStatus('saved');
        } catch (e) {
            console.error(e);
            showSaveStatus('error');
        }
    };

    return {
        loading,
        error,
        saveStatus,
        data,
        setData,
        openingHours,
        setOpeningHours,
        categories,
        setCategories,
        imageKeys,
        iconLibraries,
        updateField,
        updateHoursRow,
        saveMainData,
        saveHours,
        saveCatalog,
    };
}
