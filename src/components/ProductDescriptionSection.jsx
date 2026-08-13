import React from 'react';

const decodeEntities = (value = '') =>
    String(value)
        .replace(/&amp;/g, '&')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');

const stripTags = (value = '') => String(value).replace(/<[^>]*>/g, ' ');

const normalizeDescriptionText = (value = '') => {
    const cleaned = decodeEntities(stripTags(value))
        .replace(/\b(search|home|log\s*in|manuals\s*&\s*downloads|warranty\s*registration|contact\s*us)\b/gi, ' ')
        .replace(/\b(save\s*\$\d+(?:\.\d{1,2})?|coupon|discount|deal)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const sentences = cleaned
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length >= 24 && part.length <= 220)
        .filter((part) => !/\.(jpg|jpeg|png|webp)\b|https?:\/\//i.test(part));

    const selected = sentences.slice(0, 4).join(' ');
    return selected || cleaned;
};

const shouldRenderAsHtml = (html = '') => {
    if (!html) return false;
    const hasRichHtml = /<\/?(p|ul|ol|li|h1|h2|h3|h4|h5|h6|br|strong|em)\b/i.test(html);
    const suspicious = /\b(search\s+log\s*in\s+home|save\s*\$|manuals?\s*&\s*downloads)\b/i.test(html);
    return hasRichHtml && !suspicious;
};

const ProductDescriptionSection = ({ html, specs, keyFeatures = [] }) => {
    const hasSpecs = specs && (Array.isArray(specs) ? specs.length > 0 : Object.keys(specs).length > 0);
    const hasFeatures = Array.isArray(keyFeatures) && keyFeatures.length > 0;
    const cleanDescription = normalizeDescriptionText(html || '');
    const cleanParagraphs = cleanDescription
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 4);
    const renderHtml = shouldRenderAsHtml(html || '');

    if (!html && !hasSpecs && !hasFeatures) return null;

    return (
        <section className="pd-description-section">
            {html && <>
                <h2 className="pd-description-heading">Product Description</h2>
                {renderHtml ? (
                    <div
                        className="pd-description"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                ) : (
                    <div className="pd-description pd-description-clean">
                        {cleanParagraphs.map((line, idx) => (
                            <p key={`desc-line-${idx}`}>{line}</p>
                        ))}
                    </div>
                )}
            </>}

            {hasFeatures && (
                <div className="pd-features-summary">
                    <h3 className="pd-features-summary-title">Features</h3>
                    <ul>
                        {keyFeatures.map((feature, idx) => (
                            <li key={`${feature}-${idx}`}>{feature}</li>
                        ))}
                    </ul>
                </div>
            )}

            {hasSpecs && (
                <div className="pd-specs-section-inside">
                    <h3 className="pd-specs-title">Specifications</h3>
                    <div className="pd-specs-table-wrapper">
                        <table className="pd-specs-table">
                            <tbody>
                                {Array.isArray(specs)
                                    ? specs
                                          .filter(
                                              (item) =>
                                                  item && typeof item === 'object' &&
                                                  (item.key || item.label) && (item.value || item.val)
                                          )
                                          .map((item, idx) => (
                                              <tr key={idx}>
                                                  <td className="pd-specs-key">{item.key || item.label}</td>
                                                  <td className="pd-specs-value">{item.value || item.val}</td>
                                              </tr>
                                          ))
                                    : Object.entries(specs)
                                          .filter(([key]) => isNaN(Number(key)))
                                          .map(([key, value]) => (
                                              <tr key={key}>
                                                  <td className="pd-specs-key">{key}</td>
                                                  <td className="pd-specs-value">{value}</td>
                                              </tr>
                                          ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProductDescriptionSection;

