import React from 'react';

const ProductDescriptionSection = ({ html, specs, keyFeatures = [] }) => {
    const hasSpecs = specs && (Array.isArray(specs) ? specs.length > 0 : Object.keys(specs).length > 0);
    const hasFeatures = Array.isArray(keyFeatures) && keyFeatures.length > 0;

    if (!html && !hasSpecs && !hasFeatures) return null;

    return (
        <section className="pd-description-section">
            {html && <>
                <h2 className="pd-description-heading">Product Description</h2>
                <div
                    className="pd-description"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
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

