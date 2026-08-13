import React, { useEffect, useState } from 'react';

const SearchFilters = ({
    categories,
    brands,
    hasQuery,
    selectedCategory,
    selectedBrand,
    onCategoryChange,
    onBrandChange,
    priceRange,
    onPriceChange,
    onPriceApply,
    sort,
    onSortChange,
}) => {
    const [openSection, setOpenSection] = useState({
        sort: true,
        category: true,
        brand: brands.length > 0,
        price: true,
    });
    const [priceDraft, setPriceDraft] = useState({ min: priceRange.min || '', max: priceRange.max || '' });

    useEffect(() => {
        setPriceDraft({ min: priceRange.min || '', max: priceRange.max || '' });
    }, [priceRange.min, priceRange.max]);

    useEffect(() => {
        if (brands.length === 0) {
            setOpenSection((prev) => ({ ...prev, brand: false }));
        }
    }, [brands.length]);

    const toggleSection = (key) => {
        setOpenSection((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const hasPriceDraft = priceDraft.min !== '' || priceDraft.max !== '';

    const applyPriceRange = () => {
        if (onPriceApply) {
            onPriceApply(priceDraft.min, priceDraft.max);
            return;
        }
        onPriceChange('min', priceDraft.min);
        onPriceChange('max', priceDraft.max);
    };

    const resetPriceRange = () => {
        setPriceDraft({ min: '', max: '' });
        if (onPriceApply) {
            onPriceApply('', '');
            return;
        }
        onPriceChange('min', '');
        onPriceChange('max', '');
    };

    const sortOptions = [
        hasQuery && { value: 'relevance', label: 'Best Match' },
        { value: 'newest', label: 'Newest Arrivals' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'name-asc', label: 'Name: A-Z' },
    ].filter(Boolean);

    return (
        <aside className="filter-sidebar">
            <div className={`filter-section ${openSection.sort ? 'open' : ''}`}>
                <button type="button" className="filter-title" onClick={() => toggleSection('sort')}>
                    Sort By
                    <span className="filter-caret" aria-hidden="true">{openSection.sort ? '-' : '+'}</span>
                </button>
                <div className={`filter-content ${openSection.sort ? 'expanded' : ''}`}>
                    <div className="filter-list compact">
                        {sortOptions.map((option) => (
                            <label key={option.value} className="filter-item radio">
                                <input
                                    type="radio"
                                    name="search-sort"
                                    checked={sort === option.value}
                                    onChange={() => onSortChange(option.value)}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`filter-section ${openSection.category ? 'open' : ''}`}>
                <button type="button" className="filter-title" onClick={() => toggleSection('category')}>
                    Categories
                    <span className="filter-caret" aria-hidden="true">{openSection.category ? '-' : '+'}</span>
                </button>
                <div className={`filter-content ${openSection.category ? 'expanded' : ''}`}>
                    <div className="filter-list compact">
                        <label className="filter-item radio">
                            <input
                                type="radio"
                                name="search-category"
                                checked={selectedCategory === ''}
                                onChange={() => onCategoryChange('')}
                            />
                            All Categories
                        </label>
                        {categories.map((cat) => (
                            <label key={cat} className="filter-item radio">
                                <input
                                    type="radio"
                                    name="search-category"
                                    checked={selectedCategory === cat}
                                    onChange={() => onCategoryChange(cat)}
                                />
                                {cat}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {brands.length > 0 && (
                <div className={`filter-section ${openSection.brand ? 'open' : ''}`}>
                    <button type="button" className="filter-title" onClick={() => toggleSection('brand')}>
                        Brands
                        <span className="filter-caret" aria-hidden="true">{openSection.brand ? '-' : '+'}</span>
                    </button>
                    <div className={`filter-content ${openSection.brand ? 'expanded' : ''}`}>
                        <div className="filter-list compact">
                            <label className="filter-item radio">
                                <input
                                    type="radio"
                                    name="search-brand"
                                    checked={selectedBrand === ''}
                                    onChange={() => onBrandChange('')}
                                />
                                All Brands
                            </label>
                            {brands.map((brand) => (
                                <label key={brand} className="filter-item radio">
                                    <input
                                        type="radio"
                                        name="search-brand"
                                        checked={selectedBrand === brand}
                                        onChange={() => onBrandChange(brand)}
                                    />
                                    {brand}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={`filter-section ${openSection.price ? 'open' : ''}`}>
                <button type="button" className="filter-title" onClick={() => toggleSection('price')}>
                    Price Range
                    <span className="filter-caret" aria-hidden="true">{openSection.price ? '-' : '+'}</span>
                </button>
                <div className={`filter-content ${openSection.price ? 'expanded' : ''}`}>
                    <div className="price-range">
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceDraft.min}
                                onChange={(e) => setPriceDraft((prev) => ({ ...prev, min: e.target.value }))}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceDraft.max}
                                onChange={(e) => setPriceDraft((prev) => ({ ...prev, max: e.target.value }))}
                            />
                        </div>
                        <div className="price-actions">
                            <button
                                type="button"
                                className="price-apply"
                                onClick={applyPriceRange}
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                className="price-reset"
                                onClick={resetPriceRange}
                                disabled={!hasPriceDraft}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SearchFilters;
