import React from 'react';

const Benefits = () => {
  const benefitsData = [
    { num: "01", title: "Flexible Learning Schedule", desc: "Fit your coursework around your existing commitments and obligations." },
    { num: "02", title: "Expert Instruction", desc: "Learn from industry experts who have hands-on experience in design and development." },
    { num: "03", title: "Diverse Course Offerings", desc: "Explore a wide range of design and development courses covering various topics." },
    { num: "04", title: "Updated Curriculum", desc: "Access courses with up-to-date content reflecting the latest trends and industry practices." },
    { num: "05", title: "Practical Projects and Assignments", desc: "Develop a portfolio showcasing your skills and abilities to potential employers." },
    { num: "06", title: "Interactive Learning Environment", desc: "Collaborate with fellow learners, exchanging ideas and feedback to enhance your understanding." }
  ];

  return (
    <section className="benefits pb-5">
      <div className="container-custom px-5">
        <div className="d-flex justify-content-between align-items-start mb-2 pb-2">
          <div className="benefits-header-text pe-4">
            <h2 className="display-6 fw-bold mb-3 text-dark">Benefits</h2>
            <p className="text-secondary mb-0 fs-5 lh-lg benefits-desc">Discover the advantages of learning with Recode Academy. Our platform is designed to provide you with a seamless and rewarding educational experience tailored to your growth.</p>
          </div>
          <a href="#" className="btn bg-white border border-light-subtle text-dark px-4 py-2 fw-medium rounded-2">View All</a>
        </div>
        
        <div className="row g-4">
          {benefitsData.map((item, index) => (
            <div className="col-lg-4 col-md-6" key={index}>
              <div className="card h-80 border-0 bg-white rounded-4 p-5 position-relative benefit-card-custom">
                <div className="text-end mb-4 pb-2">
                  <span className="fw-bolder text-dark card-number">{item.num}</span>
                </div>
                <h3 className="h4 fw-bold mb-3 text-dark">{item.title}</h3>
                <p className="text-secondary mb-5 pb-5 fs-6 lh-lg">{item.desc}</p>
                <div className="arrow-btn position-absolute bottom-0 end-0 m-4 d-flex justify-content-center align-items-center rounded-2 border border-light-subtle">
                  <i className="fa-solid fa-arrow-right text-orange fs-5 arrow-icon"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;